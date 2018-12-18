import tweepy
from scremsong.util import make_logger, get_env
from scremsong.app.models import SocialPlatforms, Tweets, SocialColumns
from scremsong.app.enums import SocialPlatformChoice
from scremsong.app.social.columns import get_social_columns
from scremsong.app.social.twitter_utils import apply_tweet_filter_criteria, column_search_phrase_to_twitter_search_query
from scremsong.app.serializers import SocialColumnsSerializerWithTweetCountSerializer, TweetsSerializer
from scremsong.app import websockets
from functools import lru_cache

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


def fetch_tweets(startIndex, stopIndex, sinceId=None, maxId=None, columnIds=[]):
    columns = []
    tweets = {}
    for social_column in get_social_columns(SocialPlatformChoice.TWITTER, columnIds):
        column_tweets = get_tweets_for_column(social_column, sinceId, maxId, startIndex, stopIndex)
        column_tweet_ids = []

        for tweet in column_tweets:
            tweets[tweet["tweet_id"]] = TweetsSerializer(tweet).data
            column_tweet_ids.append(tweet["tweet_id"])

        columns.append({
            "id": social_column.id,
            "tweet_ids": column_tweet_ids,
        })

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
    # Just in case there's an issue
    try:
        logger.info(status.id_str)

        # Handle duplicate tweets (occasionally an issue) and updates to tweets (e.g. Tweets being deleted - I think?)
        tweet, created = Tweets.objects.update_or_create(
            tweet_id=status.id_str, defaults={"data": status._json}
        )

        # Send data out to clients via web sockets
        if created is True:
            websockets.send_channel_message("tweets.new_tweet", {
                "tweet": TweetsSerializer(tweet).data,
                "columnIds": get_columns_for_tweet(tweet),
            })
    except Exception as e:
        logger.error("Exception {}: '{}' for tweet_id {}".format(type(e), e, status.id_str))
    return None


def get_twitter_columns():
    cols = get_social_columns(SocialPlatformChoice.TWITTER).all()
    return SocialColumnsSerializerWithTweetCountSerializer(cols, many=True).data


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

    queryset = apply_tweet_filter_criteria(social_column, queryset)

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


def get_columns_for_tweet(tweet):
    matchedColumnIds = []
    for column in get_social_columns_cached(SocialPlatformChoice.TWITTER):
        if is_tweet_in_column(tweet.data, column) is True:
            matchedColumnIds.append(column.id)
    return matchedColumnIds


@lru_cache(maxsize=5)
def get_social_columns_cached(platform=None):
    if platform is not None:
        return SocialColumns.objects.filter(platform=platform)
    else:
        return SocialColumns.objects.all()


def is_tweet_in_column(tweet_data, social_column):
    # c.f. apply_tweet_filter_criteria() in twitter_utils.py

    # Completely ignore retweets
    if "retweeted_status" in tweet_data and tweet_data["retweeted_status"] is not None:
        return False

    # Every part of every phrase must be a match. Is this correct behaviour?
    # https://github.com/keithamoss/scremsong/issues/28
    for phrase in social_column.search_phrases:
        for phrase_part in phrase.split(" "):
            match = False
            if "extended_tweet" in tweet_data and phrase_part.lower() in tweet_data["extended_tweet"]["full_text"].lower():
                match = True

            if "text" in tweet_data and phrase_part.lower() in tweet_data["text"].lower():
                match = True

            if "full_text" in tweet_data and phrase_part.lower() in tweet_data["full_text"].lower():
                match = True

            if match is False:
                return False
    return True
