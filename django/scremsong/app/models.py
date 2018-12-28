from django.db import models
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from model_utils import FieldTracker
from scremsong.app.social.twitter_utils import apply_tweet_filter_criteria
from scremsong.app.enums import ProfileSettingQueueSortBy, SocialPlatformChoice, SocialAssignmentStatus, TweetState, TweetStatus
from scremsong.util import make_logger
from scremsong.app.enums import ProfileSettings

logger = make_logger(__name__)

# Create your models here.


class CompilationError(Exception):
    pass


def default_profile_settings():
    return {
        "queue_sort_by": ProfileSettingQueueSortBy.ByCreation
    }


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_approved = models.BooleanField(default=False)
    is_accepting_assignments = models.BooleanField(default=False)
    settings = JSONField(default=default_profile_settings, blank=True)

    tracker = FieldTracker()

    def __str__(self):
        return self.user.username

    def merge_settings(self, settings):
        for item, val in settings.items():
            if ProfileSettings.has_value(item) is True:
                # If a specific column position object is null then we want to remove it completely
                if item == "column_positions":
                    columnId = next(iter(val.keys()))
                    columnSettings = next(iter(val.values()))
                    if columnSettings is None:
                        if columnId in self.settings[item]:
                            del self.settings[item][columnId]
                        continue

                if item not in self.settings and type(val) is dict:
                    self.settings[item] = {}

                if type(self.settings[item]) is dict:
                    self.settings[item] = {**self.settings[item], **val}
                else:
                    self.settings[item] = val


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

    def total_tweets(self):
        """
        Count the number of tweets for the object
        """
        count = apply_tweet_filter_criteria(self, Tweets.objects).count()
        if count is None:
            return 0
        return count


class Tweets(models.Model):
    "Tweets we've collected for search terms we care about."

    tweet_id = models.TextField(editable=False, unique=True)
    data = JSONField()
    state = models.TextField(choices=[(tag, tag.value) for tag in TweetState], default=TweetState.ACTIVE)
    status = models.TextField(choices=[(tag, tag.value) for tag in TweetStatus])
    source = JSONField(default=list, blank=True)  # TweetSource

    class Meta:
        indexes = [
            models.Index(fields=['source']),
            models.Index(fields=['status']),
        ]


class SocialAssignments(models.Model):
    "Columns configuring what to display for each social platform."
    "e.g. All tweets that mention the term #democracysausage and the phrase 'sizzle'."

    platform = models.TextField(choices=[(tag, tag.value) for tag in SocialPlatformChoice])
    social_id = models.TextField(editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assigned_by")
    status = models.TextField(choices=[(tag, tag.value) for tag in SocialAssignmentStatus], default=SocialAssignmentStatus.PENDING)
    thread_relationships = JSONField(default=None, blank=True, null=True)
    thread_tweets = JSONField(default=None, blank=True, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("platform", "social_id")
