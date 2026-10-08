FROM postgres:16-alpine
COPY tablechart/initdb/poolStats.sql /docker-entrypoint-initdb.d/01-poolstats.sql
COPY poolStats.csv /var/lib/postgresql/poolStats.csv
