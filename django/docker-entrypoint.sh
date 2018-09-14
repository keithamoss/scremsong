#!/bin/sh

# wait for a given host:port to become available
#
# $1 host
# $2 port
function dockerwait {
    while ! exec 6<>/dev/tcp/$1/$2; do
        echo "$(date) - waiting to connect $1 $2"
        sleep 5
    done
    echo "$(date) - connected to $1 $2"

    exec 6>&-
    exec 6<&-
}

# dockerwait $DB_HOST $DB_PORT
# sleep 8

CMD="$1"
# echo $CMD

# django-admin migrate

# celery_worker entrypoint
if [ "$1" = "celery_worker" ]; then
    echo "[Run] Starting celery_worker"

    set -x
    exec celery -A scremsong worker -l info --concurrency=2 --logfile=logs/celery-worker.log
    # exec celery -A scremsong worker -l info --concurrency=2
    exit
fi

if [ "$ENVIRONMENT" = "DEVELOPMENT" ]; then
  django-admin migrate
  django-admin runserver "0.0.0.0:8000"
  exit
fi

if [ "$ENVIRONMENT" = "PRODUCTION" ]; then
  mkdir -p logs
  
  mkdir -p static
  rm -rf static/*
  django-admin collectstatic
fi

# CMD="$1"
# echo $CMD
# if [ "$CMD" = "runserver" ]; then
#     django-admin runserver "0.0.0.0:8000"
# fi

exec "$@"

