from enum import Enum


class ProfileSettings(str, Enum):
    QueueSortBy = "queue_sort_by"
    ColumnPositions = "column_positions"

    @classmethod
    def has_value(cls, value):
        return any(value == item.value for item in cls)


class ProfileSettingQueueSortBy(int, Enum):
    ByCreation = 1
    ByModified = 2


class SocialPlatformChoice(Enum):
    TWITTER = "Twitter"


class SocialAssignmentStatus(Enum):
    PENDING = "Pending"
    PROCESSED = "Processed"  # DO NOT USE
    DONE = "Done"


class NotificationVariants(str, Enum):
    DEFAULT = "default"
    ERROR = "error"
    SUCCESS = "success"
    WARNING = "warning"
    INFO = "info"


class TweetStatus(Enum):
    OK = "Ok"
    DIRTY = "Dirty"  # e.g. Part of a thread be we couldn't resolve relationships for it


class TweetSource(str, Enum):
    STREAMING = "Streaming"
    BACKFILL = "Backfill"
    THREAD_RESOLUTION = "Thread Resolution"
    # THREAD_RESOLUTION_TWEETS_TO_USER = "Thread Resolution To User"
    # THREAD_RESOLUTION_TWEETS_FROM_USER = "Thread Resolution From User"
    TESTING = "Testing"
