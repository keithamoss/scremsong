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


class SocialAssignmentStatus(Enum):
    PENDING = "Pending"
    PROCESSED = "Processed" # DO NOT USE
    DONE = "Done"

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


class SocialColumns(models.Model):
    "Columns configuring what to display for each social platform."
    "e.g. All tweets that mention the term #democracysausage and the phrase 'sizzle'."

    platform = models.TextField(choices=[(tag, tag.value) for tag in SocialPlatformChoice])

    # A comma-separated list of phrases which will be used to determine what Tweets will be delivered on the stream. A phrase may be one or more terms separated by spaces, and a phrase will match if all of the terms in the phrase are present in the Tweet, regardless of order and ignoring case. By this model, you can think of commas as logical ORs, while spaces are equivalent to logical ANDs (e.g. ‘the twitter’ is the AND twitter, and ‘the,twitter’ is the OR twitter).
    # https://developer.twitter.com/en/docs/tweets/filter-realtime/guides/basic-stream-parameters#track
    search_phrases = JSONField(default=None, blank=True, null=False)


class SocialAssignments(models.Model):
    "Columns configuring what to display for each social platform."
    "e.g. All tweets that mention the term #democracysausage and the phrase 'sizzle'."

    platform = models.TextField(choices=[(tag, tag.value) for tag in SocialPlatformChoice])
    social_id = models.TextField(editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.TextField(choices=[(tag, tag.value) for tag in SocialAssignmentStatus], default=SocialAssignmentStatus.PENDING)


class Tweets(models.Model):
    "Tweets we've collected for search terms we care about."

    tweet_id = models.TextField(editable=False, unique=True)
    data = JSONField()
    is_dismissed = models.BooleanField(default=False)
