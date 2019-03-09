#!/bin/sh

function postgres_ready(){
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

  sleep 8
}

CMD="$1"

# celery_worker entrypoint
if [ "$1" = "celery_worker" ]; then
    echo "[Run] Starting celery_worker"

    # Print all executed commands to the terminal
    set -x

    # Concurrency: 1 for streaming, 1 for backfill + processing tweets, 1 for solely processing tweets
    exec celery -A scremsong worker -n scremworker@%%h -l info --concurrency=3
    # exec celery -A scremsong worker -n scremworker@%%h -l info --concurrency=3 --logfile=logs/celery-worker.log
    exit
fi

if [ "$CMD" = "supervisord" ]; then
   waitfordb
   django-admin migrate
   /usr/bin/supervisord -c /app/supervisord.conf
   exit
fi

if [ "$ENVIRONMENT" = "DEVELOPMENT" ]; then
  django-admin migrate
  django-admin runserver "0.0.0.0:8000"
  exit
fi

if [ "$CMD" = "build" ]; then
   export ENVIRONMENT=PRODUCTION

   rm -rf /app/static
   mkdir -p /app/static

   django-admin collectstatic --noinput
   cd /app/static && tar czvf /build/django.tgz . && rm -rf /app/static
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