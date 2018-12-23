class ScremsongException(Exception):
    pass


class FailedToResolveTweet(ScremsongException):
    pass


class FailedToFetchTweetLocally(ScremsongException):
    pass
