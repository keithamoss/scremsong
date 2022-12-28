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
    . /app/build.sh
    exit
fi