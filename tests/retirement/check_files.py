"""Print presence, byte length and checksum only; run on synthetic test containers."""
import hashlib
from pathlib import Path

for name in ('/app/logs/chat_history.csv', '/logs/chat_history.csv', '/app/donors.json'):
    path = Path(name)
    if path.is_file():
        print(name, path.stat().st_size, hashlib.sha256(path.read_bytes()).hexdigest())
    else:
        print(name, 'ABSENT')
