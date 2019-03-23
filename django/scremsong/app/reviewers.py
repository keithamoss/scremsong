from django.contrib.auth.models import User

from scremsong.app.models import SocialAssignments
from scremsong.app.twitter import get_tweets_by_ids, get_tweet_from_db
from scremsong.app.serializers import ReviewerUserSerializer, TweetsSerializer, SocialAssignmentSerializer
from scremsong.util import make_logger

from datetime import datetime, timedelta

logger = make_logger(__name__)


def get_reviewer_users():
    users = User.objects.filter(is_staff=False, is_active=True).order_by("first_name").all()
    return ReviewerUserSerializer(users, many=True).data


def get_assignments(user=None):
    queryset = SocialAssignments.objects

    if user is not None:
        queryset = queryset.filter(user=user)

    queryset = queryset.order_by("-id").values()

    assignments = [a for a in queryset]
    assignmentsById = {}

    tweetIds = [a["social_id"] for a in assignments]
    for a in assignments:
        tweetIds.append(a["social_id"])
        for tweetId in a["thread_tweets"]:
            tweetIds.append(tweetId)

    tweets = {}
    for tweet in get_tweets_by_ids(tweetIds):
        tweets[tweet["tweet_id"]] = TweetsSerializer(tweet).data

    for assignment in assignments:
        assignmentsById[assignment["id"]] = SocialAssignmentSerializer(assignment).data

    return {"assignments": assignmentsById, "tweets": tweets}


def getCreationDateOfNewestTweetInAssignment(assignment):
    def parseTwitterDate(date):
        # "Tue Sep 25 02:35:07 +0000 2018"
        TWITTER_DATE_FORMAT = "%a %b %d %H:%M:%S %z %Y"
        date = datetime.strptime(date, TWITTER_DATE_FORMAT)
        return date + timedelta(microseconds=1)  # Twitter doesn't record time beyond seconds, so add a little bit of time to match the format of timezone.now()

    newestTweetId = max([assignment.social_id] + assignment.thread_tweets)
    newestTweet = get_tweet_from_db(newestTweetId)
    return parseTwitterDate(newestTweet.data["created_at"])
