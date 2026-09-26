"""Synthetic archive seed/snapshot/verification in an isolated retirement database."""

import argparse
import hashlib
import json
import os
from pathlib import Path

import psycopg2

TABLES = ('chatbot_app_conversation', 'chatbot_app_message', 'poolStats', 'poolstats_history')


def connect() -> psycopg2.extensions.connection:
    if not os.environ['DB_NAME'].startswith('retirement_'):
        raise RuntimeError('Only an explicitly named retirement test database is allowed')
    return psycopg2.connect(dbname=os.environ['DB_NAME'], user=os.environ['DB_USER'],
                            password=os.environ['DB_PASSWORD'], host=os.environ['DB_HOST'])


def seed_pools(connection: psycopg2.extensions.connection) -> None:
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE "poolStats" (date timestamp, sport integer, family integer, small integer, ice integer, guid text UNIQUE)')
        cursor.execute('CREATE TABLE poolstats_history (guid text PRIMARY KEY, weekday text, time time, sport integer, family integer, small integer, ice integer)')
        cursor.execute("INSERT INTO \"poolStats\" VALUES ('2026-09-25 10:00',12,4,1,0,'synthetic-reading')")
        cursor.execute("INSERT INTO poolstats_history VALUES ('synthetic-average','Monday','10:00',12,4,1,0)")
    connection.commit()


def seed(connection: psycopg2.extensions.connection) -> None:
    seed_pools(connection)
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO chatbot_app_conversation (session_id,created_at,updated_at) VALUES ('synthetic-session','2026-09-25','2026-09-25') RETURNING id")
        conversation = cursor.fetchone()[0]
        cursor.execute("INSERT INTO chatbot_app_message (conversation_id,role,content,timestamp) VALUES (%s,'user','Synthetic archive only','2026-09-25')", [conversation])
    connection.commit()


def snapshot(connection: psycopg2.extensions.connection) -> dict[str, str]:
    result = {}
    with connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute('SELECT * FROM "' + table + '" ORDER BY 1')
            values = json.dumps(cursor.fetchall(), default=str, ensure_ascii=False).encode()
            result[table] = hashlib.sha256(values).hexdigest()
        cursor.execute("SELECT app,name,applied FROM django_migrations WHERE app='chatbot_app' ORDER BY name")
        result['migration_records'] = hashlib.sha256(json.dumps(cursor.fetchall(), default=str).encode()).hexdigest()
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=('seed', 'seed-pools', 'snapshot', 'verify', 'clean'))
    parser.add_argument('--manifest', default='/validation/archive-before.json')
    args = parser.parse_args()
    with connect() as connection:
        if args.action == 'seed':
            seed(connection)
        elif args.action == 'seed-pools':
            seed_pools(connection)
        elif args.action == 'clean':
            with connection.cursor() as cursor:
                cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'chatbot_app_%'")
                assert not cursor.fetchall(), 'Clean installation created retired tables'
        else:
            current = snapshot(connection)
            if args.action == 'snapshot':
                Path(args.manifest).write_text(json.dumps(current), encoding='utf-8')
            else:
                assert current == json.loads(Path(args.manifest).read_text(encoding='utf-8')), 'Archive or pool data changed'
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='chatbot_app_conversation'::regclass AND contype='u'")
                    assert ('UNIQUE (session_id)',) in cursor.fetchall(), 'Conversation uniqueness changed'
                    cursor.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='chatbot_app_message'::regclass AND contype='f'")
                    assert any('REFERENCES chatbot_app_conversation(id)' in row[0] for row in cursor.fetchall()), 'Message relationship changed'
    print('PASS:', args.action)
