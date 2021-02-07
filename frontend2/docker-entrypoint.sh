#!/bin/sh

command="$1"
cd /app

if [ "$REACT_APP_ENVIRONMENT" = "DEVELOPMENT" ]; then
  # @TODO Troubleshoot why this throws this error: Couldn't find the binary git | info Visit https://yarnpkg.com/en/docs/cli/install for documentation about this command.
  # yarn
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