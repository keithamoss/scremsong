from scremsong.util import make_logger
from scremsong.app.models import SocialColumns, SocialAssignments

logger = make_logger(__name__)


def get_social_columns(platform=None, columnsIds=[]):
    if platform is not None:
        queryset = SocialColumns.objects.filter(platform=platform)

        if len(columnsIds) > 0:
            queryset = queryset.filter(id__in=columnsIds)
        return queryset
    else:
        return SocialColumns.objects.all()


def get_social_assignments(platform, socialIds):
    return SocialAssignments.objects.filter(platform=platform, social_id__in=socialIds).values()
