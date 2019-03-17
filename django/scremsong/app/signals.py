from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.contrib.auth.models import User

from scremsong.app.models import Profile, SocialAssignments, Tweets
from scremsong.app.enums import TweetState


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
        Tweets.objects.filter(tweet_id__in=instance.thread_tweets + [instance.social_id]).update(state=TweetState.ASSIGNED)


@receiver(post_delete, sender=SocialAssignments)
def set_tweets_as_unassigned(sender, instance, **kwargs):
    Tweets.objects.filter(tweet_id__in=instance.thread_tweets + [instance.social_id]).update(state=TweetState.ACTIVE)
