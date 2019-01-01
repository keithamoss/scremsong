from django.contrib.auth.models import User

from scremsong.app.models import SocialAssignments
from scremsong.app.twitter import get_tweets_by_ids
from scremsong.app.serializers import ReviewerUserSerializer, TweetsSerializer, SocialAssignmentSerializer


def get_reviewer_users():
    users = User.objects.filter(is_staff=False, is_active=True).order_by("first_name").all()
    return ReviewerUserSerializer(users, many=True).data


def get_assignments(status=None, user=None):
    queryset = SocialAssignments.objects
    if status is not None:
        queryset = queryset.filter(status=status)

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
