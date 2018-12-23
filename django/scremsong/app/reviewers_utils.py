from django.db.models import Q
from scremsong.app.models import SocialAssignments


def is_tweet_part_of_an_assignment(tweetId):
    return SocialAssignments.objects.filter(Q(social_id=tweetId) | Q(thread_tweets__contains=tweetId)).exists()
