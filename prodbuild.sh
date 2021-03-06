#!/bin/bash

CMD="$1"

if [ x"$CMD" = x ]; then
    echo "provide a command!"
    exit 1
fi

if [ "$CMD" = "frontend" ] || [ "$CMD" = "all" ]; then
  \rm -f nginx-prod/build/*.tgz
  mkdir -p nginx-prod/build/

  # build the frontend assets (this takes quite a while due to minification)
  echo "building frontend assets"
  # docker-compose -f docker-compose-buildjs.yml run frontend
  # docker-compose -f docker-compose-buildjs.yml stop
  frontend/build.sh

  # build the django assets
  echo "building django assets"
  docker-compose -f docker-compose-buildpy.yml build
  docker-compose -f docker-compose-buildpy.yml run django
  docker-compose -f docker-compose-buildpy.yml stop

  # copy assets locally for build local production nginx image (local testing only)
  cp build/frontend.tgz build/django.tgz nginx-prod/build # this is horrible, fixme

  # For local testing with docker-compose-prod.yml only
  echo "building prod nginx container for local testing"
  (cd nginx-prod && docker build -t scremsong/nginx-prod:latest .)
  (cd nginx-prod && docker build --no-cache -t scremsong/nginx-prod:latest . && cd ..)
fi

if [ "$CMD" = "django" ] || [ "$CMD" = "all" ]; then
  echo building prod django container
  (cd django && docker build -t scremsong/django:latest .)
  # (cd django && docker build --no-cache -t scremsong/django:latest . && cd ..)
  # rm django/scremsong/ealfront/templates/index.html
fi