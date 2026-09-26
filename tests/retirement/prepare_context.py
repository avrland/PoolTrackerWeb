"""Make a sanitized, disposable snapshot for retirement integration checks."""

import shutil
import subprocess
from pathlib import Path


def prepare(repo: Path, git: str) -> None:
    """Copy tracked application sources, never private environment or archive files."""
    target = repo / '.retirement-validation' / 'before'
    if target.exists():
        raise RuntimeError('Baseline snapshot already exists; do not overwrite it')
    files = subprocess.check_output([git, 'ls-files', '-z'], cwd=repo).decode().split('\0')
    for name in files:
        path = Path(name)
        if not name or path.parts[0] not in {'frontend', 'tablechart', 'scrapper'}:
            continue
        if path.name.startswith('.env') or path.name in {'donors.json', 'chat_history.csv', 'pw.json'}:
            continue
        if any(part in {'logs', 'backups', 'node_modules', '__pycache__'} for part in path.parts):
            continue
        destination = target / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(repo / path, destination)
    print('Sanitized baseline source snapshot created')


if __name__ == '__main__':
    import sys
    prepare(Path(__file__).resolve().parents[2], sys.argv[1])
