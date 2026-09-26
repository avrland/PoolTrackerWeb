# PoolTrackerWeb Development Guidelines

Auto-generated from feature plans; active technologies updated after retirement 007 (2026-09-26).

## Active Technologies

- Python 3.14.2 (Dockerfile base image: `python:3.14.2-slim`) + Django, Gunicorn, WhiteNoise, psycopg2-binary, Plotly, Pandas, Requests, django-ratelimit, python-dotenv; React/JSX, Vite and Nginx for the active frontend.

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.14.2 (Dockerfile base image: `python:3.14.2-slim`): Follow standard conventions

## Recent Changes

- 007-remove-retired-features: removed chatbot/donor functionality and dependencies; historical entries below describe their original introduction, not the active stack.

- 001-postgres-docker-setup: Added Python 3.14.2 (Dockerfile base image: `python:3.14.2-slim`) + Django, Gunicorn, WhiteNoise, psycopg2-binary (zastępuje mysqlclient/pymysql), LangChain, LangChain-Google-Genai, Qdrant-client, Plotly, Pandas, Bleach, Pydantic, Requests, django-ratelimit, python-dotenv

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
