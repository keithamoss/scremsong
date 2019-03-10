#!/bin/bash

ver="$1"
CMD="$2"

if [ x"$ver" = x ]; then
        echo "set a version!"
        exit 1
fi

if [ x"$CMD" = x ]; then
    echo "provide a command!"
    exit 1
fi

. prodbuild.sh $CMD
. prodbuild-dockerpush.sh $ver $CMD