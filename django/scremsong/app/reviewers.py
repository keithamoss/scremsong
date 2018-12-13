from django.contrib.auth.models import User
from django.forms.models import model_to_dict
from scremsong.app.models import SocialAssignments, SocialAssignmentStatus
from scremsong.app.twitter import get_tweets_by_ids


def get_reviewer_users():
    reviewers = []
    for reviewer in User.objects.filter(is_staff=False, is_active=True):
        reviewers.append({
            "id": reviewer.id,
            "username": reviewer.username,
            "name": "{} {}".format(reviewer.first_name, reviewer.last_name),
            "initials": "{}{}".format(reviewer.first_name[:1], reviewer.last_name[:1]),
            "is_accepting_assignments": reviewer.profile.is_accepting_assignments,
        })
    return reviewers


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
        tweets[tweet["tweet_id"]] = {"id": tweet["tweet_id"], "data": tweet["data"], "is_dismissed": tweet["is_dismissed"]}

    for assignment in assignments:
        assignmentsById[assignment["id"]] = assignment
        
        tweets[assignment["social_id"]]["reviewer_id"] = assignment["user_id"]
        tweets[assignment["social_id"]]["review_status"] = assignment["status"]

    return {"assignments": assignmentsById, "tweets": tweets}
