from django.apps import AppConfig
from scremsong.util import make_logger

logger = make_logger(__name__)


class MyAppConfig(AppConfig):
    name = 'scremsong.app'

    def ready(self):
        import scremsong.app.signals  # noqa
