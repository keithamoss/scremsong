from scremsong.util import get_env
from scremsong.app.models import AllowedUsers

USER_FIELDS = ["username", "email"]


def allowed_email(email):
    allowed_emails = list(AllowedUsers.objects.all().values_list("email", flat=True))
    if len(allowed_emails) > 1:
        return email in allowed_emails
    return False

# https://medium.com/trabe/user-account-validation-with-social-auth-django-658ff00404b5
# https://stackoverflow.com/questions/39472975/django-python-social-auth-only-allow-certain-users-to-sign-in


def create_user(strategy, details, user=None, *args, **kwargs):
    if user:
        return {
            "is_new": False
        }

    fields = dict((name, kwargs.get(name, details.get(name)))
                  for name in strategy.setting("USER_FIELDS", USER_FIELDS))

    if not fields:
        return

    if not allowed_email(fields["email"]):
        return

    return {
        "is_new": True,
        "user": strategy.create_user(**fields)
    }
