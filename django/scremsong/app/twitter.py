import tweepy
from scremsong.util import make_logger, get_env
import os
import uuid
import datetime
import pytz
import json
from scremsong.app.models import SocialPlatforms, SocialPlatformChoice, Tweets, SocialColumns
from django.db.models import Q
from scremsong.celery import celery_init_tweet_streaming
from scremsong.app.social.columns import get_social_columns
from scremsong.app.social.assignments import get_social_assignments

logger = make_logger(__name__)


def get_twitter_app():
    return SocialPlatforms.objects.filter(platform=SocialPlatformChoice.TWITTER).first()


def get_tweepy_api_auth(wait_on_rate_limit=False, wait_on_rate_limit_notify=False):
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


def fetch_some_tweets(startIndex, stopIndex, sinceId=None, maxId=None, columnIds=[]):
    columns = []
    tweets = {}
    for social_column in get_social_columns(SocialPlatformChoice.TWITTER, columnIds):
        column_tweets = get_tweets_for_column(social_column, sinceId, maxId, startIndex, stopIndex)
        column_tweet_ids = []

        for tweet in column_tweets:
            tweets[tweet["tweet_id"]] = {"data": tweet["data"], "is_dismissed": tweet["is_dismissed"]}
            column_tweet_ids.append(tweet["tweet_id"])

        columns.append({
            "id": social_column.id,
            "tweets": column_tweet_ids,
        })

        social_assignments = get_social_assignments(SocialPlatformChoice.TWITTER, column_tweet_ids)
        for assignment in social_assignments:
            tweets[assignment["social_id"]]["reviewer_id"] = assignment["user_id"]
            tweets[assignment["social_id"]]["review_status"] = assignment["status"]

    return {
        "columns": columns,
        "tweets": tweets,
    }


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


def column_search_phrase_to_twitter_search_query(social_column):
    return " OR ".join(social_column.search_phrases)


def apply_tweet_filter_criteria(social_column, queryset):
    for phrase in social_column["search_phrases"]:
        for phrase_part in phrase.split(" "):
            queryset = queryset.filter(Q(data__extended_tweet__full_text__icontains=phrase_part) | Q(data__text__icontains=phrase_part) | Q(data__full_text__icontains=phrase_part))

    return queryset.filter(data__retweeted_status__isnull=True)


def get_twitter_columns():
    columns = []
    for column in get_social_columns(SocialPlatformChoice.TWITTER).values():
        columns.append({
            **column,
            "total_tweets": get_total_tweets_for_column(column),
        })
    return columns


def get_total_tweets_for_column(social_column):
    queryset = apply_tweet_filter_criteria(social_column, Tweets.objects)
    return queryset.count()


def get_tweets_by_ids(tweetIds):
    return Tweets.objects.filter(tweet_id__in=tweetIds).values()


def get_tweets_for_column(social_column, since_id=None, max_id=None, startIndex=None, stopIndex=None):
    queryset = Tweets.objects

    if since_id is not None:
        queryset = queryset.filter(tweet_id__gt=since_id)

    if max_id is not None:
        queryset = queryset.filter(tweet_id__lte=max_id)

    if since_id is not None and max_id is not None and since_id >= max_id:
        logger.warning("since_id {} is out of range of max_id {} in get_tweets_for_column - it should be a lower number!")
        return None

    queryset = apply_tweet_filter_criteria(social_column.__dict__, queryset)

    tweets = queryset.order_by("-tweet_id").values()

    if startIndex is not None and stopIndex is not None:
        return tweets[int(startIndex):int(stopIndex)]
    else:
        return tweets


def fill_in_missing_tweets(since_id, max_id):
    if since_id >= max_id:
        logger.warning("since_id {} is out of range of max_id {} in fill_in_missing_tweets - it should be a lower number!".format(since_id, max_id))
        return None

    api = get_tweepy_api_auth(wait_on_rate_limit=True, wait_on_rate_limit_notify=True)
    if api is None:
        logger.warning("No Twitter credentials available! Please generate them by-hand.")
        return None

    total_tweets_added = 0
    for column in get_social_columns(SocialPlatformChoice.TWITTER):
        tweets_added = 0
        q = column_search_phrase_to_twitter_search_query(column)
        for status in tweepy.Cursor(api.search, q=q, result_type="recent", tweet_mode="extended", include_entities=True, since_id=since_id, max_id=max_id).items():
            save_tweet(status)
            tweets_added += 1
            total_tweets_added += 1

        logger.info("Filled in {} missing tweets for the query '{}'".format(tweets_added, q))

    return total_tweets_added


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

        def on_connect(self):
            logger.error("on_connect")

        def on_data(self, raw_data):
            logger.error("on_data")
            return super(MyStreamListener, self).on_data(raw_data)

        def on_delete(self, status_id, user_id):
            """Called when a delete notice arrives for a status"""
            logger.error("on_delete: {}, {}".format(status_id, user_id))
            return

        def keep_alive(self):
            """Called when a keep-alive arrived"""
            logger.error("keep_alive")
            return

    # Create Twitter app credentials + config store if it doesn't exist
    t = get_twitter_app()
    if t is None:
        t = SocialPlatforms(platform=SocialPlatformChoice.TWITTER)
        t.save()
        t = get_twitter_app()

    # Begin streaming!
    api = get_tweepy_api_auth(wait_on_rate_limit=True, wait_on_rate_limit_notify=True)
    if api is None:
        logger.warning("No Twitter credentials available! Please generate them by-hand.")
        return None

    try:
        myStreamListener = MyStreamListener()
        myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)

        track = []
        [track.extend(column.search_phrases) for column in get_social_columns(SocialPlatformChoice.TWITTER)]
        if len(track) == 0:
            logger.info("No search phrases are set - we won't try to stream tweets")
        else:
            logger.info("track")
            logger.info(track)
            myStream.filter(track=track)
            logger.info("Streaming Twitter connection establised successfully for terms: {}.".format(", ".join(track)))
    except Exception as e:
        logger.error("Exception {}: '{}' during streaming".format(type(e), e))
