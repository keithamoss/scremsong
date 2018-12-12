from scremsong.util import get_env

USER_FIELDS = ["username", "email"]


def allowed_email(email):
    allowed_emails = get_env("AUTHORISED_USERS")
    if allowed_emails is not None and len(allowed_emails) > 1:
        return email in allowed_emails.split(",")
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
