#!/bin/sh

# This breaks on purpose so we can manually test the `flower` commands - to be fixed if we ever got this working properly
until timeout 10 celery -A scremsong inspect ping; do
    >&2 echo "Celery workers not available"
    sleep 8
done

echo 'Starting flower'

# Use this is running in our own container built from ./django
# Note: You will need to poetry/pip install flower first/as well
flower -A scremsong --logging=DEBUG --persistent=True

# Use this if running from the official Docker image
flower --logging=DEBUG --persistent=True

# An alternative option where the redis URLs are passed directly - but this seems not to be needed?
flower --broker=redis://:PASS@redis:6379/0 --broker_api=redis://:PASS@redis:6379/0 --logging=DEBUG --persistent=True

# Some parameters that would be useful if this ever worked
--inspect_timeout=60000
--port=8765

# Note: We'd also want to enable the GitHub auth layer