import json
from django.db import models
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from django.apps import apps
from model_utils import FieldTracker
from scremsong.util import make_logger
import hashlib
import copy
from enum import Enum

logger = make_logger(__name__)


class SocialPlatformChoice(Enum):
    TWITTER = "Twitter"

# Create your models here.


class CompilationError(Exception):
    pass


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_approved = models.BooleanField(default=False)

    tracker = FieldTracker()

    def __str__(self):
        return self.user.username


class SocialPlatforms(models.Model):
    "Configuration, credentials, and log store for social platforms."

    platform = models.TextField(primary_key=True, choices=[(tag, tag.value) for tag in SocialPlatformChoice])
    credentials = JSONField(default=None, blank=True, null=True)  # Credentials store for long-lived secrets for social platforms
    active_app_uuid = models.CharField(max_length=36, editable=False, null=True)
    pid = models.IntegerField(null=True)
    errors = JSONField(default=list, blank=True, null=True)
    log = JSONField(default=list, blank=True, null=True)


class Tweets(models.Model):
    "Tweets we've collected for search terms we care about."

    tweet_id = models.TextField(editable=False, unique=True)
    data = JSONField()
