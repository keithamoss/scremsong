from django.dispatch import receiver
from django.db.models.signals import pre_save, post_save, post_delete
from django.contrib.auth.models import User

from scremsong.app.models import Profile, SocialAssignments, Tweets
from scremsong.app.enums import TweetState
from scremsong.app.twitter import get_column_for_tweet_with_priority
from scremsong.app import websockets


@receiver(post_save, sender=User)
def create_user(sender, instance, created, **kwargs):
    if created:
        is_approved = True
        Profile.objects.create(user=instance, is_approved=is_approved)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


@receiver(post_save, sender=SocialAssignments)
def set_tweets_as_assigned(sender, instance, created, **kwargs):
    if created is True or instance.tracker.has_changed("thread_tweets") is True:
        tweetIds = instance.thread_tweets + [instance.social_id]
        Tweets.objects.filter(tweet_id__in=tweetIds).update(state=TweetState.ASSIGNED)

        websockets.send_channel_message("tweets.set_state", {
            "tweetStates": [{"tweetId": t, "tweetState": TweetState.ASSIGNED} for t in tweetIds],
        })


@receiver(post_delete, sender=SocialAssignments)
def set_tweets_as_unassigned(sender, instance, **kwargs):
    tweetIds = instance.thread_tweets + [instance.social_id]
    Tweets.objects.filter(tweet_id__in=tweetIds).update(state=TweetState.ACTIVE)

    websockets.send_channel_message("tweets.set_state", {
        "tweetStates": [{"tweetId": t, "tweetState": TweetState.ACTIVE} for t in tweetIds],
    })


@receiver(pre_save, sender=Tweets)
def set_tweet_column(sender, instance, **kwargs):
    if instance.column_id is None:
        columnId = get_column_for_tweet_with_priority(instance)
        if columnId is not None:
            instance.column_id = columnId
