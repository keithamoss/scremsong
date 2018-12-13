from django.contrib.auth.models import User
from scremsong.app.models import SocialAssignments, SocialAssignmentStatus
from scremsong.app.twitter import get_tweets_by_ids
from scremsong.app.serializers import ReviewerUserSerializer, TweetsSerializer, SocialAssignmentSerializer


def get_reviewer_users():
    users = User.objects.filter(is_staff=False, is_active=True).all()
    return ReviewerUserSerializer(users, many=True).data


def get_all_pending_assignments(user=None):
    queryset = SocialAssignments.objects.filter(status=SocialAssignmentStatus.PENDING)
    if user is not None:
        queryset = queryset.filter(user=user)
    queryset = queryset.order_by("-id").values()
    assignments = [a for a in queryset]
    assignmentsById = {}

    tweetIds = [a["social_id"] for a in assignments]
    tweets = {}
    for tweet in get_tweets_by_ids(tweetIds):
        tweets[tweet["tweet_id"]] = TweetsSerializer(tweet).data

    for assignment in assignments:
        assignmentsById[assignment["id"]] = SocialAssignmentSerializer(assignment).data

    return {"assignments": assignmentsById, "tweets": tweets}
