from django.contrib import admin
from django.contrib.auth.models import User
from django.apps import apps
from .models import Profile
from scremsong.util import get_env

# Register your models here.
admin.register(Profile)(admin.ModelAdmin)


def get_admins():
    return User.objects.filter(is_staff=True, is_superuser=True, is_active=True).all()


def is_development():
    return get_env("ENVIRONMENT") == "DEVELOPMENT"
