# PoolTrackerWeb_avrland Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-05-06

## Active Technologies
- Python 3.11 (Django backend), Node.js 20 LTS (React frontend build), Nginx 1.25-alpine (serving) + React 18, Vite 5, TanStack Query (React Query), react-apexcharts, django-cors-headers (dev only) (003-react-frontend)
- PostgreSQL 16 (bez zmian) (003-react-frontend)
- Python 3.11 (backend Django), JavaScript/ES2022 (frontend React 18, Vite 5) + Django 4.x + Gunicorn (backend), React 18 + TanStack Query + react-apexcharts (frontend), django-cors-headers (dev) (004-restore-frontend-features)
- PostgreSQL 16 — tabela `poolStats` (bieżące dane), `poolstats_history` (dane historyczne) (004-restore-frontend-features)
- JavaScript/ES2022 (frontend only) + React 18, TanStack Query 5, react-apexcharts 1.4.0, ApexCharts 3.54.0, Vite 5 (005-ui-fixes-countdown-chart-icon)
- N/A (frontend presentation layer; reads from existing `/api/current/` and `/update_chart/stats{day}` endpoints) (005-ui-fixes-countdown-chart-icon)

- Python 3.11 (web Django), Python 3.11-slim (scrapper — upgrade z 3.8) + Django 4.x + Gunicorn (web), psycopg2-binary (scrapper), schedule (scrapper), Docker Compose v3.8 (002-scrapper-docker-integration)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

Python 3.11 (web Django), Python 3.11-slim (scrapper — upgrade z 3.8): Follow standard conventions

## Recent Changes
- 005-ui-fixes-countdown-chart-icon: Added JavaScript/ES2022 (frontend only) + React 18, TanStack Query 5, react-apexcharts 1.4.0, ApexCharts 3.54.0, Vite 5
- 004-restore-frontend-features: Added Python 3.11 (backend Django), JavaScript/ES2022 (frontend React 18, Vite 5) + Django 4.x + Gunicorn (backend), React 18 + TanStack Query + react-apexcharts (frontend), django-cors-headers (dev)
- 003-react-frontend: Added Python 3.11 (Django backend), Node.js 20 LTS (React frontend build), Nginx 1.25-alpine (serving) + React 18, Vite 5, TanStack Query (React Query), react-apexcharts, django-cors-headers (dev only)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
