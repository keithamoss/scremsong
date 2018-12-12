from scremsong.app.models import SocialAssignments


def get_social_assignments(platform, socialIds):
    return SocialAssignments.objects.filter(platform=platform, social_id__in=socialIds).values()
