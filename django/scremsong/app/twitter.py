import tweepy
from scremsong.util import make_logger, get_env
import os
import uuid
import datetime
import pytz
import json
from scremsong.app.models import SocialPlatforms, SocialPlatformChoice, Tweets
from django.db.models import Q
from scremsong.celery import celery_init_tweet_streaming

logger = make_logger(__name__)


def get_twitter_app():
    return SocialPlatforms.objects.filter(platform=SocialPlatformChoice.TWITTER).first()


def get_tweepy_api_auth():
    t = get_twitter_app()

    if t.credentials is not None and "access_token" in t.credentials and "access_token_secret" in t.credentials:
        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
        auth.set_access_token(t.credentials["access_token"], t.credentials["access_token_secret"])
        return tweepy.API(auth)
    return None


def twitter_user_api_auth_stage_1():
    auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
    redirect_url = auth.get_authorization_url()
    t = get_twitter_app()
    t.credentials = {"request_token": auth.request_token}
    t.save()
    return redirect_url


def twitter_user_api_auth_stage_2(query_params):
    auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
    t = get_twitter_app()

    if t.credentials is None or "request_token" not in t.credentials:
        raise Exception("request_token not available - run auth1 first")
    if "oauth_verifier" not in query_params:
        raise Exception("oauth_verifier not available")

    auth.request_token = {
        "oauth_token": t.credentials["request_token"]["oauth_token"],
        "oauth_token_secret": query_params["oauth_verifier"]
    }
    auth.get_access_token(query_params["oauth_verifier"])

    t.credentials = {
        "access_token": auth.access_token,
        "access_token_secret": auth.access_token_secret,
    }
    t.save()
    return True


def get_latest_tweet_id():
    try:
        return Tweets.objects.filter().latest("tweet_id").tweet_id
    except Tweets.DoesNotExist:
        return None


def get_next_tweet_id(tweet_id):
    try:
        t = Tweets.objects.filter(tweet_id__gt=tweet_id).order_by("tweet_id").first()
        if t is not None:
            return t.tweet_id
        return None
    except Tweets.DoesNotExist:
        return None


def save_tweet(status):
    try:
        # Handle the occasional duplicate tweet that Twitter sends us
        t = Tweets(tweet_id=status.id_str, data=status._json)
        t.save()
        logger.info(status.id_str)
    except Exception as e:
        logger.error("Exception {}: '{}' for tweet_id {}".format(type(e), e, status.id_str))


def fill_in_missing_tweets(since_id, max_id):
    if since_id >= max_id:
        logger.warning("since_id {} is out of range of max_id {} - it should be a lower number!")
        return None

    api = get_tweepy_api_auth()
    if api is None:
        logger.warning("No Twitter credentials available! Please generate them by-hand.")
        return None

    tweets_added = 0
    for status in tweepy.Cursor(api.search, q=["#TDF OR #TDF2018"], result_type="recent", tweet_mode="extended", since_id=since_id, max_id=max_id).items():
        save_tweet(status)
        tweets_added += 1
    return tweets_added


def open_tweet_stream():
    # https://stackoverflow.com/a/33660005/7368493
    class MyStreamListener(tweepy.StreamListener):
        def on_status(self, status):
            save_tweet(status)

        def on_error(self, status_code):
            if status_code == 420:
                logger.warn("Streaming got status {}. Disconnecting from stream.".format(status_code))

                # Fire off tasks to restart streaming (delayed by 2s)
                celery_init_tweet_streaming()

                # Returning False in on_error disconnects the stream
                return False
            logger.warn("Streaming got status {}. Taking no action.".format(status_code))

        def on_limit(self, track):
            logger.warn("Received an on limit message from Twitter.")
            pass

        def on_timeout(self):
            logger.error("Streaming connection to Twitter has timed out.")

            # Fire off tasks to restart streaming (delayed by 2s)
            celery_init_tweet_streaming()

            # Returning False in on_timeout disconnects the stream
            return False

        def on_disconnect(self, notice):
            logger.error("Received a disconnect notice from Twitter. {}".format(notice))

            # Fire off tasks to restart streaming (delayed by 2s)
            celery_init_tweet_streaming()

            # Returning False in on_disconnect disconnects the stream
            return False

        def on_warning(self, notice):
            logger.error("Received disconnection warning notice from Twitter. {}".format(notice))

    # Create Twitter app credentials + config store if it doesn't exist
    t = get_twitter_app()
    if t is None:
        t = SocialPlatforms(platform=SocialPlatformChoice.TWITTER)
        t.save()
        t = get_twitter_app()

    # Begin streaming!
    api = get_tweepy_api_auth()
    if api is None:
        logger.warning("No Twitter credentials available! Please generate them by-hand.")
        return None

    try:
        myStreamListener = MyStreamListener()
        myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)
        myStream.filter(track=["#TDF", "#TDF2018"])
        logger.warn("Streaming Twitter connection establised successfully.")
    except Exception as e:
        logger.error("Exception {}: '{}' during streaming".format(type(e), e))
