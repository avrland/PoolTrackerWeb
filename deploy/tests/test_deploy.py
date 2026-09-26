"""Exercise the real Bash state machine with isolated Docker/GitHub stand-ins."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "pooltracker-deploy.sh"
OLD = "a" * 40
NEW = "b" * 40


def manifest(sha):
    return {"schema": 1, "sha": sha, "images": {
        name: f"ghcr.io/avrland/pooltrackerweb-{name}@sha256:{sha + sha[:24]}"
        for name in ("web", "frontend", "scrapper")
    }}


MOCK = r'''#!/usr/bin/env python3
import json, os, pathlib, sys
root = pathlib.Path(os.environ['MOCK_ROOT'])
mode = os.environ.get('MOCK_MODE', '')
args = sys.argv[1:]
tool = pathlib.Path(sys.argv[0]).name
with (root / 'calls').open('a') as log:
    log.write(json.dumps({'tool': tool, 'args': args, 'image': os.getenv('WEB_IMAGE')}) + '\n')
new = 'b' * 40
target = json.loads((root / 'target.json').read_text())
if tool == 'curl':
    url = next(x for x in args if x.startswith('http'))
    if '/commits/main' in url:
        if mode == 'network': sys.exit(22)
        print(json.dumps({'sha': 'a' * 40 if mode == 'unchanged' else new}))
    elif '/releases/tags/' in url:
        if mode == 'no_release': sys.exit(22)
        print(json.dumps({'assets': [{'name':'manifest.json', 'id':1}]}))
    elif '/releases/download/' in url:
        if mode == 'invalid_manifest': target['images']['web'] = 'evil/image:latest'
        print(json.dumps(target))
    elif '/api/health/' in url:
        active = (root / 'active').read_text() if (root / 'active').exists() else ''
        if mode == 'health' and new in active: sys.exit(22)
        print('{"status":"ok"}')
elif tool == 'docker':
    if args[0] == 'inspect':
        if '.State.Running' in args[2]: print('true false')
        elif '.Mounts' in args[2]: print('existing_logs_data' if '/logs' in args[2] else 'existing_postgres_data')
        elif 'working_dir' in args[2]: print(str(root))
        elif '.Config.Labels' in args[2]: print('existing')
        else: print('sha256:' + 'c' * 64)
    if 'pull' in args and mode == 'pull': sys.exit(1)
    if 'pg_dump' in ' '.join(args):
        if mode == 'backup': sys.exit(1)
        print('-- test database backup')
    if 'migrate' in args and mode == 'migration': sys.exit(1)
    if 'up' in args and 'web' in args:
        (root / 'active').write_text(os.environ.get('WEB_IMAGE', ''))
'''


@unittest.skipUnless(os.name == "posix" and shutil.which("jq"), "Requires Linux, Bash and jq")
class DeployTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / "state"
        self.state.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        for name in ("docker", "curl"):
            file = self.bin / name
            file.write_text(MOCK)
            file.chmod(0o755)
        (self.root / "target.json").write_text(json.dumps(manifest(NEW)))
        (self.state / "state.json").write_text(json.dumps({
            "project": "existing", "current": manifest(OLD), "previous": None,
        }))
        self.env = dict(os.environ, PATH=f"{self.bin}:{os.environ['PATH']}",
                        APP_DIR=str(self.root), STATE_DIR=str(self.state),
                        POOLTRACKER_CONFIG=str(self.root / "absent"), MOCK_ROOT=str(self.root),
                        HEALTH_TIMEOUT="1", REPOSITORY="avrland/PoolTrackerWeb")

    def run_deploy(self, mode="", command="check", success=True):
        result = subprocess.run(["bash", str(SCRIPT), command],
                                env=dict(self.env, MOCK_MODE=mode), capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def current(self):
        return json.loads((self.state / "state.json").read_text())["current"]["sha"]

    def calls(self):
        file = self.root / "calls"
        return [json.loads(line) for line in file.read_text().splitlines()] if file.exists() else []

    def test_unchanged_network_and_unfinished_ci_leave_containers_untouched(self):
        for mode in ("unchanged", "network", "no_release"):
            with self.subTest(mode=mode):
                self.run_deploy(mode)
                self.assertEqual(self.current(), OLD)
        self.assertFalse(any(c["tool"] == "docker" for c in self.calls()))

    def test_success_commits_state_and_only_replaces_application(self):
        self.run_deploy()
        self.assertEqual(self.current(), NEW)
        state = json.loads((self.state / "state.json").read_text())
        self.assertEqual(state["previous"]["sha"], OLD)
        self.assertFalse((self.state / "pending.json").exists())
        self.assertTrue(list((self.root / "backups").glob("*.sql.gz")))
        commands = [c["args"] for c in self.calls() if c["tool"] == "docker"]
        pull = next(i for i, c in enumerate(commands) if "pull" in c)
        stop = next(i for i, c in enumerate(commands) if "stop" in c)
        self.assertLess(pull, stop)
        for c in commands:
            self.assertNotIn("down", c)
            if "up" in c:
                self.assertIn("--no-deps", c)
                self.assertNotIn("db", c)
                self.assertNotIn("backup", c)
            if c[0] == "compose":
                self.assertEqual(c[c.index("-p") + 1], "existing")

    def test_pull_failure_never_stops_application(self):
        self.run_deploy("pull", success=False)
        self.assertEqual(self.current(), OLD)
        self.assertFalse(any("stop" in c["args"] for c in self.calls()))

    def test_invalid_manifest_never_touches_docker(self):
        self.run_deploy("invalid_manifest", success=False)
        self.assertFalse(any(c["tool"] == "docker" for c in self.calls()))

    def test_backup_migration_and_health_failures_restore_and_block(self):
        for mode in ("backup", "migration", "health"):
            with self.subTest(mode=mode):
                (self.state / "blocked").unlink(missing_ok=True)
                self.run_deploy(mode, success=False)
                self.assertEqual(self.current(), OLD)
                self.assertEqual((self.state / "blocked").read_text().strip(), NEW)
                self.assertFalse((self.state / "pending.json").exists())
                self.assertIn(OLD, (self.root / "active").read_text())

    def test_blocked_sha_requires_explicit_retry(self):
        (self.state / "blocked").write_text(NEW)
        self.run_deploy()
        self.assertEqual(self.current(), OLD)
        self.run_deploy(command="retry")
        self.assertEqual(self.current(), NEW)
        self.assertFalse((self.state / "blocked").exists())

    def test_rollback_does_not_migrate_or_immediately_redeploy(self):
        self.run_deploy()
        (self.root / "calls").write_text("")
        self.run_deploy(command="rollback")
        self.assertEqual(self.current(), OLD)
        self.assertFalse(any("migrate" in c["args"] for c in self.calls()))
        self.run_deploy()
        self.assertEqual(self.current(), OLD)

    def test_interrupted_deployment_recovers_and_blocks_candidate(self):
        (self.state / "pending.json").write_text(json.dumps(manifest(NEW)))
        self.run_deploy()
        self.assertEqual(self.current(), OLD)
        self.assertIn(OLD, (self.root / "active").read_text())
        self.assertFalse((self.state / "pending.json").exists())

    def test_crash_after_commit_does_not_roll_back_success(self):
        self.run_deploy()
        (self.state / "pending.json").write_text(json.dumps(manifest(NEW)))
        self.run_deploy()
        self.assertEqual(self.current(), NEW)
        self.assertFalse((self.state / "blocked").exists())

    def test_lock_excludes_second_process(self):
        import fcntl
        with (self.state / "lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.run_deploy()
        self.assertEqual(self.calls(), [])

    def test_init_preserves_original_images_and_database(self):
        (self.state / "state.json").unlink()
        self.run_deploy(command="init")
        self.assertEqual(self.current(), "bootstrap")
        self.assertFalse(any("stop" in c["args"] or "up" in c["args"] for c in self.calls()))
        self.assertEqual(sum("tag" in c["args"] for c in self.calls()), 3)


if __name__ == "__main__":
    unittest.main()
