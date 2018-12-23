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


def get_tweepy_api_auth(compression=False, wait_on_rate_limit=True, wait_on_rate_limit_notify=True):
    t = get_twitter_app()

    if t.credentials is not None and "access_token" in t.credentials and "access_token_secret" in t.credentials:
        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
        auth.set_access_token(t.credentials["access_token"], t.credentials["access_token_secret"])
        return tweepy.API(auth, compression=compression, wait_on_rate_limit=wait_on_rate_limit, wait_on_rate_limit_notify=wait_on_rate_limit_notify)
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


def get_latest_tweet_id_for_streaming():
    try:
        t = Tweets.objects.filter(status=TweetStatus.OK).filter(source__contains=TweetSource.STREAMING).latest("tweet_id")
        if t is not None:
            return t.tweet_id
        return None
    except Tweets.DoesNotExist:
        return None


def get_next_tweet_id_for_streaming(tweet_id):
    try:
        t = Tweets.objects.filter(tweet_id__gt=tweet_id).filter(status=TweetStatus.OK).filter(source__contains=TweetSource.STREAMING).order_by("tweet_id").first()
        if t is not None:
            return t.tweet_id
        return None
    except Tweets.DoesNotExist:
        return None


def save_tweet(tweetData, source, status):
    # Just in case there's an issue
    try:
        # Handle duplicate tweets (occasionally an issue) and updates to tweets (e.g. Tweets being deleted - I think?)
        tweet, created = Tweets.objects.update_or_create(
            tweet_id=tweetData["id_str"], defaults={"data": tweetData, "status": status}
        )

        # Merge and update TweetSource
        if source is not None and source not in tweet.source:
            tweet.source += [source]
            tweet, ignore = Tweets.objects.update_or_create(
                tweet_id=tweetData["id_str"], defaults={"source": tweet.source}
            )

        return tweet, created
    except Exception as e:
        logger.error("Exception {}: '{}' for tweet_id {}".format(type(e), e, tweetData["id_str"]))
    return None


def notify_of_saved_tweets(tweets):
    if len(tweets) > 0:
        response = {
            "tweets": {},
            "columnIds": {},
        }

        for tweet in tweets:
            response["tweets"][tweet.tweet_id] = TweetsSerializer(tweet).data
            response["columnIds"][tweet.tweet_id] = get_columns_for_tweet(tweet),

        websockets.send_channel_message("tweets.new_tweets", response)


def notify_of_saved_tweet(tweet):
    notify_of_saved_tweets([tweet])


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


def tweepy_rate_limit_handled(cursor, waitFor=None):
    """http://docs.tweepy.org/en/3.7.0/code_snippet.html"""
    waitCounter = 0
    while True:
        try:
            yield cursor.next()
        except tweepy.RateLimitError:
            logger.warning("Got a RateLimitError from Tweepy while using a cursor. Waiting fof 60s.")

            if waitFor is not None:
                waitCounter += 1
                if waitCounter == waitFor:
                    raise ScremsongException("Tried {} times to wait for the Twitter API. Giving up!".format(waitCounter))

            sleep(60)
        except StopIteration:
            break


def fill_in_missing_tweets(since_id, max_id):
    if since_id >= max_id:
        logger.warning("since_id {} is out of range of max_id {} in fill_in_missing_tweets - it should be a lower number!".format(since_id, max_id))
        return None

    api = get_tweepy_api_auth()
    if api is None:
        logger.warning("No Twitter credentials available! Please generate them by-hand.")
        return None

    tweets = []
    total_tweets_added = 0
    for column in get_social_columns(SocialPlatformChoice.TWITTER):
        tweets_added = 0
        q = column_search_phrase_to_twitter_search_query(column)
        for status in tweepy_rate_limit_handled(tweepy.Cursor(api.search, q=q, result_type="recent", tweet_mode="extended", include_entities=True, since_id=since_id, max_id=max_id).items()):
            tweet, created = save_tweet(status._json, source=TweetSource.BACKFILL, status=TweetStatus.OK)
            tweets.append(tweet)

            tweets_added += 1
            total_tweets_added += 1

        logger.info("Filled in {} missing tweets for the query '{}'".format(tweets_added, q))

    # Sort all of our backfilled tweets by their id (i.e. newest tweets first) so our thread resolution code can maximise use of the local database
    tweetsByAge = sorted(tweets, key=itemgetter("tweet_id"), reverse=True)

    for tweet in tweetsByAge:
        if is_a_reply(tweet.data) is False:
            save_tweet(tweet.data, source=TweetSource.BACKFILL, status=TweetStatus.OK)
        else:
            # Save the tweet anyway so we can send the en masse notice of new tweets
            save_tweet(tweet.data, source=TweetSource.BACKFILL, status=TweetStatus.DIRTY)

            logger.info("Sending tweet {} to the queue to be processed for backfill".format(tweet.tweet_id))
            task_process_tweet_reply.apply_async(args=[tweet.data, TweetSource.BACKFILL, False])

    notify_of_saved_tweets(tweets)
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


def get_tweet_text(status):
    """Refer to https://developer.twitter.com/en/docs/tweets/tweet-updates.html"""
    if "extended_tweet" in status:
        return status["extended_tweet"]["full_text"]
    elif "full_text" in status:
        return status["full_text"]
    elif "text" in status:
        return status["text"]
    return None


def is_tweet_in_column(tweet_data, social_column):
    # c.f. apply_tweet_filter_criteria() in twitter_utils.py

    # Completely ignore retweets
    if "retweeted_status" in tweet_data and tweet_data["retweeted_status"] is not None:
        return False

    # Every part of every phrase must be a match. Is this correct behaviour?
    # https://github.com/keithamoss/scremsong/issues/28
    tweet_text = get_tweet_text(tweet_data)
    for phrase in social_column.search_phrases:
        for phrase_part in phrase.split(" "):
            if phrase_part.lower() not in tweet_text.lower():
                return False
    return True


def is_a_reply(status):

            if "full_text" in tweet_data and phrase_part.lower() in tweet_data["full_text"].lower():
                match = True

            if match is False:
                return False
    return True
