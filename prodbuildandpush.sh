#!/bin/bash

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

. prodbuild.sh $CMD
. prodbuild-dockerpush.sh $CMD