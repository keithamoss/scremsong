#!/bin/bash

# push images to Docker Hub

if [ ! -f ./VERSION ]; then
    echo "File not found!"
    exit 1
fi

VERSION=`cat VERSION`
CMD="$1"

if [ x"$VERSION" = x ]; then
        echo "set a version!"
        exit 1
fi

if [ x"$CMD" = x ]; then
    echo "provide a command!"
    exit 1
fi

if [ "$CMD" = "frontend" ] || [ "$CMD" = "all" ]; then
    # echo pushing prod nginx container
    # docker tag scremsong/nginx:latest scremsong/nginx-prod:"$VERSION"
    # docker push scremsong/nginx:latest
    # docker push scremsong/nginx:"$VERSION"

    echo versioning frontend assets
    mv build/django.tgz build/django-$VERSION.tgz
    mv build/frontend.tgz build/frontend-$VERSION.tgz
fi

if [ "$CMD" = "django" ] || [ "$CMD" = "all" ]; then
    echo pushing prod django container
    docker tag scremsong/django:latest keithmoss/scremsong-django:latest
    docker tag scremsong/django:latest keithmoss/scremsong-django:"$VERSION"
    docker push keithmoss/scremsong-django:latest
    docker push keithmoss/scremsong-django:"$VERSION"
fi