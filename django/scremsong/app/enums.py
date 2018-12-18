from enum import Enum


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
