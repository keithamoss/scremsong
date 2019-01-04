#!/bin/bash

# push images to Docker Hub
# @TODO version images

ver="$1"

if [ x"$ver" = x ]; then
        echo "set a version!"
        exit 1
fi

# echo pushing prod nginx container
# docker tag scremsong/nginx:latest scremsong/nginx-prod:"$ver"
# docker push scremsong/nginx:latest
# docker push scremsong/nginx:"$ver"

echo versioning frontend assets
mv build/django.tgz build/django-$ver.tgz
mv build/frontend.tgz build/frontend-$ver.tgz

echo pushing prod django container
docker tag scremsong/django:latest keithmoss/scremsong-django:latest
docker tag scremsong/django:latest keithmoss/scremsong-django:"$ver"
docker push keithmoss/scremsong-django:latest
docker push keithmoss/scremsong-django:"$ver"