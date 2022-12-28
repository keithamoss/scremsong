#!/bin/sh

postgres_ready()
{
python << END
import sys
import psycopg2
try:
    conn = psycopg2.connect(dbname="$DB_NAME", user="$DB_USERNAME", password="$DB_PASSWORD", host="$DB_HOST")
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)
END
}

waitfordb()
{
  until postgres_ready; do
    >&2 echo "Postgres is unavailable - sleeping"
    sleep 1
  done

  >&2 echo "Postgres is up - continuing..."

  sleep 4
}

redis_ready()
{
python << END
import sys
from redis import Redis
try:
  Redis.from_url("$RQ_REDIS_URL")
except redis.exceptions.BusyLoadingError:
  sys.exit(-1)
sys.exit(0)
END
}

waitforredis()
{
  until redis_ready; do
    >&2 echo "Redis is unavailable - sleeping"
    sleep 1
  done

  >&2 echo "Redis is up - continuing..."

  sleep 4
}

CMD="$1"

# python_rq_worker entrypoint
if [ "$CMD" = "python_rq_supervisord" ]; then
    waitfordb
    waitforredis
    echo "[Run] Starting python_rq_supervisord"

   python /app/scremsong/rq/init.py
   /usr/bin/supervisord -c /app/scremsong/rq/supervisord.dev.conf
   exit
fi

if [ "$CMD" = "supervisord" ]; then
   waitfordb
   django-admin migrate
   /usr/bin/supervisord -c /app/supervisord.conf
   exit
fi

if [ "$CMD" = "build" ]; then
  rm -rf /app/static
  mkdir -p /app/static
  
  django-admin collectstatic --noinput

  cd /app/static && tar czvf /build/django.tgz .
   exit
fi

if [ "$ENVIRONMENT" = "DEVELOPMENT" ]; then
  waitfordb
  django-admin migrate
  django-admin runserver "0.0.0.0:8000"
  exit
fi

# if [ "$CMD" = "uwsgi" ]; then
#    waitfordb
#    export ENVIRONMENT=PRODUCTION
#    django-admin migrate
#    django-admin collectstatic --noinput
#    chown 1000:1000 /var/log/django.log
#    uwsgi --lazy-apps --uid 1000 --gid 1000 --http-socket :9090 --wsgi scremsong.wsgi --master --processes 8 --threads 8
#    exit
# fi

exec "$@"