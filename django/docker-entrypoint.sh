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

django-admin migrate

if [ "$ENVIRONMENT" = "PRODUCTION" ]; then
  mkdir -p logs
  
  mkdir -p static
  rm -rf static/*
  django-admin collectstatic
fi

CMD="$1"
echo $CMD
if [ "$CMD" = "runserver" ]; then
    django-admin runserver "0.0.0.0:8000"
fi

exec "$@"

