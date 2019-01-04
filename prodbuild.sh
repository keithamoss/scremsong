#!/bin/bash

\rm -f nginx-prod/build/*.tgz
mkdir -p nginx-prod/build/

# build the frontend assets (this takes quite a while due to minification)
docker-compose -f docker-compose-buildjs.yml run frontend
docker-compose -f docker-compose-buildjs.yml stop

# build the django assets
docker-compose -f docker-compose-buildpy.yml build
docker-compose -f docker-compose-buildpy.yml run django
docker-compose -f docker-compose-buildpy.yml stop

# build production nginx image
cp build/frontend.tgz build/django.tgz nginx-prod/build # this is horrible, fixme

# For local testing with docker-compose-prod.yml only
# echo building prod nginx container
# (cd nginx-prod && docker build -t scremsong/nginx-prod:latest .)
# (cd nginx-prod && docker build --no-cache -t scremsong/nginx-prod:latest . && cd ..)

echo building prod django container
(cd django && docker build -t scremsong/django:latest .)
# (cd django && docker build --no-cache -t scremsong/django:latest . && cd ..)
# rm django/scremsong/ealfront/templates/index.html