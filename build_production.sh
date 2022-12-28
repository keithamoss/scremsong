#!/bin/bash

CMD="$1"
LATEST_IMAGE_TAG="latest-production"

if [ x"$CMD" = x ]; then
    echo "provide a command!"
    exit 1
fi

if [ "$CMD" = "full-run" ]; then
    echo "Build - Prep"
    rm -rf ./nginx-prod/build/
    mkdir ./nginx-prod/build
fi

if [ "$CMD" = "django-only" ] || [ "$CMD" = "full-run" ]; then
    echo -e "\n\n Django - Build Static Assets"
    docker compose --file build_production.yml run django

    echo -e "\n\n Containers - Build Django"
    cd django && docker build -t keithmoss/scremsong-django:$LATEST_IMAGE_TAG . && cd ../
fi

if [ "$CMD" = "frontend-only" ] || [ "$CMD" = "full-run" ]; then
    echo -e "\n\n Frontend - Build"
    docker compose --file build_production.yml run public

    echo -e "\n\n Containers - Build Nginx"
    cd nginx-prod && docker build -t keithmoss/scremsong-nginx:$LATEST_IMAGE_TAG . && cd ../
fi
# Containers - Push to Docker Hub
if [ "$CMD" = "django-only" ]; then
    docker push keithmoss/scremsong-django:$LATEST_IMAGE_TAG
elif [ "$CMD" = "frontend-only" ]; then
    docker push keithmoss/scremsong-nginx:$LATEST_IMAGE_TAG
elif [ "$CMD" = "full-run" ]; then
    docker push keithmoss/scremsong-nginx:$LATEST_IMAGE_TAG
    docker push keithmoss/scremsong-django:$LATEST_IMAGE_TAG
fi