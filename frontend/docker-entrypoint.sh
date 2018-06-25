#!/bin/sh

# wait for a given host:port to become available
#
# $1 host
# $2 port
# function dockerwait {
#     while ! exec 6<>/dev/tcp/$1/$2; do
#         echo "$(date) - waiting to connect $1 $2"
#         sleep 5
#     done
#     echo "$(date) - connected to $1 $2"

#     exec 6>&-
#     exec 6<&-
# }

cd /app
if [ "$REACT_APP_ENVIRONMENT" = "DEVELOPMENT" ]; then
#   HTTPS=true npm run start
  npm run start
elif [ "$REACT_APP_ENVIRONMENT" = "PRODUCTION" ]; then
  npm install .
  npm run build
fi

# CMD="$1"
# if [ "$CMD" = "nginx" ]; then
#     nginx -g 'daemon off;'
# fi

# exec "$@"