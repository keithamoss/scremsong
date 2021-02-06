#!/bin/sh

command="$1"
cd /app

if [ "$REACT_APP_ENVIRONMENT" = "DEVELOPMENT" ]; then
  yarn
  yarn run start
  exit
fi

if [ x"$command" = x"build" ]; then
    export TERM=xterm

    apk add --no-cache git
    yarn

    rm -rf /app/build
    mkdir -p /app/build

    yarn run build
    cd /app/build && tar czvf /build/frontend.tgz .
    exit
fi