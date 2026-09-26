#!/bin/sh
set -e

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "==> Starting Gunicorn..."
exec gunicorn tablechart.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
