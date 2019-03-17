"""
Django settings for ealgis project.

Generated by 'django-admin startproject' using Django 1.10.4.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from scremsong.util import get_env

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_env("SECRET_KEY")

# Security
SECURE_SSL_REDIRECT = True
# https://stackoverflow.com/a/22284717
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
CORS_ALLOW_CREDENTIALS = True

if get_env("ENVIRONMENT") == "PRODUCTION":
    DEBUG = False
    CONN_MAX_AGE = 50  # Half our max number of PostgreSQL connections

    CORS_ORIGIN_WHITELIST = (
        "scremsong.democracysausage.org"
    )
    CSRF_TRUSTED_ORIGINS = (
        "scremsong.democracysausage.org"
    )
    ALLOWED_HOSTS = [
        "scremsong.democracysausage.org"
    ]

    SESSION_COOKIE_DOMAIN = "scremsong.democracysausage.org"
    CSRF_COOKIE_DOMAIN = "scremsong.democracysausage.org"

    STATIC_ROOT = "/app/static"

    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
            },
        },
        "handlers": {
            "file": {
                "level": "INFO",
                "class": "logging.FileHandler",
                "filename": "/app/logs/django.log",
                "formatter": "verbose",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["file"],
                "level": "INFO",
                "propagate": True,
            },
        },
    }
else:
    DEBUG = True
    CONN_MAX_AGE = 50  # Half our max number of PostgreSQL connections

    CORS_ORIGIN_WHITELIST = (
        "scremsong.test.democracysausage.org"
    )
    CSRF_TRUSTED_ORIGINS = (
        "scremsong.test.democracysausage.org"
    )
    ALLOWED_HOSTS = ["scremsong.test.democracysausage.org"]

    SESSION_COOKIE_DOMAIN = "scremsong.test.democracysausage.org"
    CSRF_COOKIE_DOMAIN = "scremsong.test.democracysausage.org"

    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, "static")
    ]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'social_django',
    'scremsong.app',
    'rest_framework',
    'corsheaders',
    'django_celery_results',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.twitter.TwitterOAuth',
    'social_core.backends.yahoo.YahooOpenId',
    'social_core.backends.facebook.FacebookOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    # 'social_core.pipeline.user.create_user',
    'scremsong.app.auth.create_user',
    # 'ealgis.ealauth.pipeline.do_something',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'scremsong.app.auth.get_avatar',
)

ROOT_URLCONF = 'scremsong.urls'

LOGIN_REDIRECT_URL = get_env("SITE_BASE_URL")
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True

SOCIAL_AUTH_TWITTER_KEY = get_env('SOCIAL_AUTH_TWITTER_KEY')
SOCIAL_AUTH_TWITTER_SECRET = get_env('SOCIAL_AUTH_TWITTER_SECRET')

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = get_env('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = get_env('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET')

SOCIAL_AUTH_FACEBOOK_KEY = get_env('SOCIAL_AUTH_FACEBOOK_KEY')
SOCIAL_AUTH_FACEBOOK_SECRET = get_env('SOCIAL_AUTH_FACEBOOK_SECRET')

# django-channels
ASGI_APPLICATION = "scremsong.routing.application"
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(get_env("CHANNELS_HOST_URL"))],
            "prefix": "asgi-scremsong:",
        },
    },
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
#         'LOCATION': 'memcached:11211',
#     }
# }


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

# DATABASES = {}
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'options': '-c search_path={}'.format(get_env('DB_SCHEMA'))
        },
        'NAME': get_env('DB_NAME'),
        'USER': get_env('DB_USERNAME'),
        'PASSWORD': get_env('DB_PASSWORD'),
        'HOST': get_env('DB_HOST'),
        'PORT': get_env('DB_PORT'),
    },
}


# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Django REST Framework

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-au'

TIME_ZONE = 'Australia/Perth'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = '/api/static/'

# Celery

CELERY_BROKER_URL = get_env("CELERY_BROKER_URL")
CELERY_TIMEZONE = TIME_ZONE
CELERY_RESULT_BACKEND = "django-db"
CELERY_TASK_IGNORE_RESULT = True
# Fixes "Connection reset by peer" errors. At the time of writing (July 2018) this was an open issue in Celery 4.2.1
# https://github.com/celery/celery/issues/4226
CELERY_BROKER_POOL_LIMIT = None
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "fanout_prefix": True,
    "fanout_patterns": True
}
CELERY_TASK_DEFAULT_QUEUE = "celery-scremsong"

# Sentry SDK

sentry_sdk.init(
    dsn=get_env("RAVEN_URL"),
    integrations=[DjangoIntegration()],
    send_default_pii=True,
    environment=get_env("ENVIRONMENT")
)

with sentry_sdk.configure_scope() as scope:
    scope.level = "warning"
    scope.set_extra("site", get_env("RAVEN_SITE_NAME"))


# Project-specific settings
# c.f. https://github.com/andrewgodwin/channels-examples/blob/9e6a26c8e6404483695cbd96ebf12fc4ed9956b2/multichat/multichat/settings.py
MSG_TYPE_CONNECTED = "ws/scremsong/CONNECTED"
MSG_TYPE_NOTIFICATION = "ws/scremsong/NOTIFICATION"
MSG_TYPE_TWEETS_STREAMING_STATE = "ws/scremsong/tweets/STREAMING_STATE"
MSG_TYPE_TWEETS_RATE_LIMIT_STATE = "ws/scremsong/tweets/RATE_LIMIT_STATE"
MSG_TYPE_TWEETS_RATE_LIMIT_RESOURCES = "ws/scremsong/tweets/RATE_LIMIT_RESOURCES"
MSG_TYPE_TWEETS_NEW_TWEETS = "ws/scremsong/tweets/NEW_TWEETS"
MSG_TYPE_TWEETS_LOAD_TWEETS = "ws/scremsong/tweets/LOAD_TWEETS"
MSG_TYPE_TWEETS_UPDATE_TWEETS = "ws/scremsong/tweets/UPDATE_TWEETS"
MSG_TYPE_TWEETS_SET_STATE = "ws/scremsong/tweets/SET_STATE"
MSG_TYPE_TWEETS_PRECANNED_REPLIES = "ws/scremsong/tweets/PRECANNED_REPLIES"
MSG_TYPE_SOCIAL_COLUMNS_LIST = "ws/scremsong/social_columns/LIST"
MSG_TYPE_SOCIAL_COLUMNS_UPDATE = "ws/scremsong/social_columns/UPDATE"
MSG_TYPE_REVIEWERS_USER_CONNECTED = "ws/scremsong/reviewers/USER_CONNECTED"
MSG_TYPE_REVIEWERS_LIST_USERS = "ws/scremsong/reviewers/LIST_USERS"
MSG_TYPE_REVIEWERS_LIST_ASSIGNMENTS = "ws/scremsong/reviewers/LIST_ASSIGNMENTS"
MSG_TYPE_REVIEWERS_ASSIGN = "ws/scremsong/reviewers/ASSIGN"
MSG_TYPE_REVIEWERS_UNASSIGN = "ws/scremsong/reviewers/UNASSIGN"
MSG_TYPE_REVIEWERS_BULK_ASSIGN = "ws/scremsong/reviewers/BULK_ASSIGN"
MSG_TYPE_REVIEWERS_ASSIGNMENT_UPDATED = "ws/scremsong/reviewers/ASSIGNMENT_UPDATED"
MSG_TYPE_REVIEWERS_ASSIGNMENT_METADATA_CHANGED = "ws/scremsong/reviewers/ASSIGNMENT_METADATA_CHANGED"
MSG_TYPE_REVIEWERS_SET_STATUS = "ws/scremsong/reviewers/SET_STATUS"
MSG_TYPE_USER_CHANGE_SETTINGS = "ws/scremsong/user/CHANGE_SETTINGS"
