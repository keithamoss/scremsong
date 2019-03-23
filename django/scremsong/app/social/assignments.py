import datetime

from django.db.models import Count
from django.utils import timezone

from scremsong.app.models import SocialAssignments
from scremsong.app.enums import SocialAssignmentCloseReason, SocialAssignmentState


def get_social_assignments(platform, socialIds):
    return SocialAssignments.objects.filter(platform=platform, social_id__in=socialIds).values()


def get_social_assignment_stats_for_user(user, sincePastNDays=None):
    baseStats = {str(d): 0 for d in SocialAssignmentCloseReason}

    baseStats[SocialAssignmentState.PENDING] = SocialAssignments.objects.filter(user=user).filter(state=SocialAssignmentState.PENDING).count()

    queryset = SocialAssignments.objects.filter(user=user).filter(close_reason__isnull=False)
    if sincePastNDays is not None:
        queryset = queryset.filter(created_on__gte=timezone.now() - datetime.timedelta(days=sincePastNDays))
    queryset = queryset.values("close_reason").annotate(dcount=Count("close_reason"))

    return {**baseStats, **dict(queryset.values_list("close_reason", "dcount"))}
