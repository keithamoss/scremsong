from scremsong.util import make_logger
from scremsong.app.models import SocialColumns

logger = make_logger(__name__)


def get_social_columns(platform=None):
    if platform is not None:
        return SocialColumns.objects.filter(platform=platform)
    else:
        return SocialColumns.objects.all()
