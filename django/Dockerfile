FROM python:3.9.1-alpine3.12
LABEL maintainer="<keithamoss@gmail.com>"

ENV PYTHONUNBUFFERED 1
ENV VIRTUAL_ENV /env
# ENV PYTHON_PIP_VERSION 21.0.1
ENV DJANGO_SETTINGS_MODULE scremsong.settings

RUN python -m venv "$VIRTUAL_ENV"
# RUN python -m venv "$VIRTUAL_ENV" && \
#   "$VIRTUAL_ENV"/bin/pip install -U pip==$PYTHON_PIP_VERSION

ENV PATH "$VIRTUAL_ENV"/bin:$PATH

RUN mkdir /app

WORKDIR /app

# psycopg2 requires pg_config to be available.
# Installing pg_config takes a little more work on Alpine images.
# Credit: https://stackoverflow.com/a/47871121
RUN apk update
RUN apk add postgresql-libs && apk add --virtual .build-deps gcc musl-dev postgresql-dev && apk add supervisor && rm -rf /var/cache/apk/*

# So we can install the Python cryptography used by gevent (and others)
# https://stackoverflow.com/a/63836279/7368493
RUN apk add --update alpine-sdk && apk add libffi-dev openssl-dev

# Upgrade SetupTools from 28.8 to latest due to a bug installing python-memcached on Python 3.6
# c.f. https://github.com/pypa/setuptools/issues/866
RUN pip install --upgrade setuptools

RUN python -m pip install --upgrade pip
RUN pip install wheel

ADD requirements.txt /app/
RUN pip install -r requirements.txt --no-cache-dir

ADD . /app/
RUN pip install -e .
RUN apk --purge del .build-deps gcc musl-dev

ENTRYPOINT ["/app/docker-entrypoint.sh"]
