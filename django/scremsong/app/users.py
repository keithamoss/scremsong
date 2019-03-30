from scremsong.app.models import Profile


def is_user_accepting_assignments(userId):
    return Profile.objects.values_list("is_accepting_assignments", flat=True).get(user_id=userId)
