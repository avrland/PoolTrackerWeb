# Owner-private Railway deployment

Deploy branch: `deploy/railway-private`.

Services:
- postgres: build from `deploy/railway/postgres.Dockerfile`, persistent volume at `/var/lib/postgresql/data`. No public domains or TCP proxies.
- web: root `/tablechart`; built using its Dockerfile; private endpoint `web.railway.internal:8000`. No public domains or TCP proxies.
- frontend: root repository; Dockerfile `deploy/railway/frontend.Dockerfile`; only publicly reachable service, port 8080. Requires OWNER_LOGIN and OWNER_PASSWORD_HASH (nginx htpasswd APR1 or bcrypt hash). BACKEND_HOST=web.railway.internal. Healthcheck /healthz returns no application data.
- scrapper: root `/scrapper`; private background worker.

web and scrapper receive DB_HOST=postgres.railway.internal, DB_PORT=5432, DB_NAME, DB_USER and DB_PASSWORD as service references.
web also requires a randomly generated SECRET_KEY and DJANGO_DEBUG=False.

The owner login protects all frontend assets and every proxied API route.
There is no public registration. Keep the owner's password private; anyone who
possesses it can authenticate as the owner. The database initializes bundled
historical CSV records only when the volume is empty.

Rotate owner access by replacing OWNER_PASSWORD_HASH and redeploying frontend.
Use Railway volume backups for disaster recovery.
