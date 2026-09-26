"""Check the production Docker ignore policy with synthetic files, never real archives."""

import shutil
import subprocess
import tempfile
from pathlib import Path


def validate(repo: Path) -> None:
    with tempfile.TemporaryDirectory(prefix='retirement-packaging-') as directory:
        root = Path(directory)
        shutil.copyfile(repo / 'tablechart/.dockerignore', root / '.dockerignore')
        (root / 'logs').mkdir()
        (root / 'logs/chat_history.csv').write_text('SYNTHETIC ONLY', encoding='utf-8')
        (root / 'donors.json').write_text('{"synthetic": true}', encoding='utf-8')
        (root / '.env example').write_text('SYNTHETIC=true', encoding='utf-8')
        (root / 'Dockerfile').write_text('FROM postgres:16-alpine\nCOPY . /probe\n', encoding='utf-8')
        subprocess.run(['docker', 'build', '-q', '-t', 'retirement007-packaging', str(root)], check=True)
        subprocess.run(['docker', 'run', '--rm', '--entrypoint', 'sh', 'retirement007-packaging', '-c',
                        'test ! -e /probe/donors.json && test ! -e /probe/logs/chat_history.csv && test ! -e "/probe/.env example"'], check=True)
    print('PASS: archives are excluded from build context')


if __name__ == '__main__':
    validate(Path(__file__).resolve().parents[2])
