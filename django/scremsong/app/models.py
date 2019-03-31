import datetime

from django.db import models
from django.db.models import F, Func
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from model_utils import FieldTracker

from scremsong.app.social.twitter_utils import apply_tweet_filter_criteria
from scremsong.app.enums import ProfileSettingQueueSortBy, SocialPlatformChoice, SocialAssignmentState, SocialAssignmentCloseReason, TweetState, TweetStatus, TweetReplyCategories, ProfileOfflineReason
from scremsong.util import make_logger
from scremsong.app.enums import ProfileSettings

logger = make_logger(__name__)

# Create your models here.


class CompilationError(Exception):
    pass


def default_profile_settings():
    return {
        "queue_sort_by": ProfileSettingQueueSortBy.ByCreation,
        "triage_only_show_assigned_columns": False,
    }


class ProfileJSONField(JSONField):
    description = "Custom JSONField for user profiles to ensure default settings are always included"

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return {**default_profile_settings(), **value}


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_image_url = models.URLField(blank=False)
    is_approved = models.BooleanField(default=False)
    is_accepting_assignments = models.BooleanField(default=False)
    offline_reason = models.TextField(choices=[(tag, tag.value) for tag in ProfileOfflineReason], null=True)
    settings = ProfileJSONField(default=default_profile_settings, blank=True)

    tracker = FieldTracker()

    def __str__(self):
        return self.user.username

    def merge_settings(self, settings):
        for item, val in settings.items():
            if ProfileSettings.has_value(item) is True:
                if item not in self.settings and type(val) is dict:
                    self.settings[item] = {}

                # If a specific column position object is null then we want to remove it completely
                if item == "column_positions":
                    columnId = next(iter(val.keys()))
                    columnSettings = next(iter(val.values()))
                    if columnSettings is None:
                        if columnId in self.settings[item]:
                            del self.settings[item][columnId]
                        continue

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

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    platform = models.TextField(choices=[(tag, tag.value) for tag in SocialPlatformChoice])
    priority = models.IntegerField(null=True, validators=[MinValueValidator(1)])
    disabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("platform", "priority")

    # A comma-separated list of phrases which will be used to determine what Tweets will be delivered on the stream. A phrase may be one or more terms separated by spaces, and a phrase will match if all of the terms in the phrase are present in the Tweet, regardless of order and ignoring case. By this model, you can think of commas as logical ORs, while spaces are equivalent to logical ANDs (e.g. ‘the twitter’ is the AND twitter, and ‘the,twitter’ is the OR twitter).
    # https://developer.twitter.com/en/docs/tweets/filter-realtime/guides/basic-stream-parameters#track
    search_phrases = JSONField(default=None, blank=True, null=False)

    def total_tweets(self):
        """
        Count the number of tweets for the column
        """
        count = apply_tweet_filter_criteria(self, Tweets.objects).count()
        if count is None:
            return 0
        return count

    def total_active_tweets(self, sincePastNDays=None):
        """
        Count the number of active tweets for the column
        """
        # @TODO This is a bit rubbish. We could pull created_at out as a PostgreSQL timestmap field.
        queryset = apply_tweet_filter_criteria(self, Tweets.objects).filter(state=TweetState.ACTIVE)
        if sincePastNDays is not None:
            queryset = queryset.annotate(diff_in_days=Func(F("data__created_at"), function="EXTRACT", template="%(function)s(EPOCH FROM CURRENT_TIMESTAMP - to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY')) / 86400")).filter(diff_in_days__lte=sincePastNDays)

        count = queryset.count()
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
    column = models.ForeignKey(SocialColumns, on_delete=models.PROTECT, null=True)

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
    state = models.TextField(choices=[(tag, tag.value) for tag in SocialAssignmentState], default=SocialAssignmentState.PENDING)
    close_reason = models.TextField(choices=[(tag, tag.value) for tag in SocialAssignmentCloseReason], default=None, null=True)
    thread_relationships = JSONField(default=None, blank=True, null=True)
    thread_tweets = JSONField(default=None, blank=True, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_updated_on = models.DateTimeField(auto_now_add=True)
    last_read_on = models.DateTimeField(blank=True, null=True)

    tracker = FieldTracker(fields=["thread_tweets"])

    class Meta:
        unique_together = ("platform", "social_id")


class TweetReplies(models.Model):
    "Our pre-canned responses to tweets."

    reply_text = models.TextField()
    category = models.TextField(choices=[(tag, tag.value) for tag in TweetReplyCategories], null=True)


class TwitterRateLimitInfo(models.Model):
    "Automatically collected information about our consumption of Twitter's rate limits."

    collected_on = models.DateTimeField(auto_now_add=True)
    data = JSONField()


class AllowedUsers(models.Model):
    "Our whitelist of allowed users"

    email = models.EmailField(unique=True, blank=False)
