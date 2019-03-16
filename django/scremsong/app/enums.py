from enum import Enum


class EnumBase(Enum):
    @classmethod
    def has_value(cls, value):
        return any(value == item.value for item in cls)


class ProfileSettings(str, EnumBase):
    QueueSortBy = "queue_sort_by"
    ColumnPositions = "column_positions"


class ProfileSettingQueueSortBy(int, EnumBase):
    ByCreation = 1
    ByModified = 2


class SocialPlatformChoice(EnumBase):
    TWITTER = "Twitter"


class SocialAssignmentStatus(str, EnumBase):
    PENDING = "Pending"
    AWAIT_REPLY = "Await Reply"
    CLOSED = "Closed"
    DONE = "Done"

    def __str__(self):
        return self.value


class NotificationVariants(str, EnumBase):
    DEFAULT = "default"
    ERROR = "error"
    SUCCESS = "success"
    WARNING = "warning"
    INFO = "info"


class TweetState(str, EnumBase):
    ACTIVE = "Active"
    DEALT_WITH = "Dealt With"
    DISMISSED = "Dismissed"


class TweetStatus(EnumBase):
    OK = "Ok"
    DIRTY = "Dirty"  # e.g. Part of a thread be we couldn't resolve relationships for it


class TweetSource(str, EnumBase):
    STREAMING = "Streaming"
    BACKFILL = "Backfill"
    THREAD_RESOLUTION = "Thread Resolution"
    RETWEETING = "Retweeting"
    REPLYING = "Replying"
    # THREAD_RESOLUTION_TWEETS_TO_USER = "Thread Resolution To User"
    # THREAD_RESOLUTION_TWEETS_FROM_USER = "Thread Resolution From User"
    TESTING = "Testing"


class TweetReplyCategories(str, EnumBase):
    POSITIVE_REPORT = "Positive Report"
    NEGATIVE_REPORT = "Negative Report"
    THANK_YOUS = "Thank Yous"


class TwitterRateLimitState(int, EnumBase):
    EVERYTHING_OK = 1
    WARNING = 2
    RATE_LIMITED = 3
