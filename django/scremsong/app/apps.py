from django.apps import AppConfig
from scremsong.util import make_logger, get_env
from raven import Client

logger = make_logger(__name__)


class MyAppConfig(AppConfig):
    name = 'scremsong.app'

    def ready(self):
        import scremsong.app.signals  # noqa

        # Raven
        raven_config = {"dsn": get_env("RAVEN_URL"), "environment": get_env("ENVIRONMENT"), "site": get_env("EALGIS_SITE_NAME")}
        # Disable logging errors dev
        from scremsong.app.admin import is_development
        if is_development():
            raven_config["dsn"] = None
        self.raven = Client(**raven_config)

        # Make us a new UUID if we're booting up for the first time on this instance
        # But don't bother if this is a `django-admin migrate` calls
        # c.f. docker-entrypoint.sh
        if get_env("SCREMSONG_DJANGO_MIGRATE") == "0":
            from scremsong.app.twitter import make_app_uuid, open_tweet_stream
            make_app_uuid()
            open_tweet_stream()
