from django.apps import AppConfig
from scremsong.util import make_logger, get_env
from raven import Client

logger = make_logger(__name__)


class MyAppConfig(AppConfig):
    name = 'scremsong.app'

    def ready(self):
        import scremsong.app.signals  # noqa

        # Raven
        raven_config = {"dsn": get_env("RAVEN_URL"), "environment": get_env("ENVIRONMENT"), "site": get_env("RAVEN_SITE_NAME")}
        # Disable logging errors dev
        from scremsong.app.admin import is_development
        if is_development():
            raven_config["dsn"] = None
        self.raven = Client(**raven_config)
