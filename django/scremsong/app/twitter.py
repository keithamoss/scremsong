import tweepy

from scremsong.util import make_logger, get_env, get_or_none
from scremsong.app.models import SocialPlatforms, Tweets, SocialColumns, SocialAssignments, TweetReplies
from scremsong.app.enums import SocialPlatformChoice, SocialAssignmentStatus, NotificationVariants, TweetStatus, TweetSource
from scremsong.app.social.columns import get_social_columns
from scremsong.app.social.twitter_utils import apply_tweet_filter_criteria, column_search_phrase_to_twitter_search_query
from scremsong.app.serializers import SocialColumnsSerializerWithTweetCountSerializer, TweetsSerializer, SocialAssignmentSerializer
from scremsong.app import websockets
from scremsong.app.exceptions import ScremsongException, FailedToResolveTweet
from scremsong.app.reviewers_utils import is_tweet_part_of_an_assignment
from scremsong.celery import task_process_tweet_reply

from django.utils import timezone

from functools import lru_cache
from time import sleep

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


def fetch_tweets_for_columns(columnPositions, columnIds=[]):
    columns = []
    tweets = {}

    for social_column in get_social_columns(SocialPlatformChoice.TWITTER, columnIds):
        hasColumnPosition = columnPositions is not None and str(social_column.id) in columnPositions
        if hasColumnPosition is True:
            sinceId = int(columnPositions[str(social_column.id)]["stopTweet"]) - 1
            column_tweets = get_tweets_for_column_by_tweet_ids(social_column, sinceId)
        else:
            column_tweets = get_tweets_for_column(social_column, startIndex=0, stopIndex=20)

        column_tweet_ids = []
        column_tweet_ids_buffered = []

        for tweet in column_tweets:
            tweets[tweet["tweet_id"]] = TweetsSerializer(tweet).data

            if hasColumnPosition is True and int(tweet["tweet_id"]) > int(columnPositions[str(social_column.id)]["firstTweet"]):
                column_tweet_ids_buffered.append(tweet["tweet_id"])
            else:
                column_tweet_ids.append(tweet["tweet_id"])

        columns.append({
            "id": social_column.id,
            "tweet_ids": column_tweet_ids,
            "tweet_ids_buffered": column_tweet_ids_buffered,
        })

    return {
        "columns": columns,
        "tweets": tweets,
    }


def get_tweets_for_column_by_tweet_ids(social_column, since_id=None, max_id=None):
    queryset = Tweets.objects

    if since_id is not None:
        queryset = queryset.filter(tweet_id__gt=since_id)

    if max_id is not None:
        queryset = queryset.filter(tweet_id__lte=max_id)

    if since_id is not None and max_id is not None and since_id >= max_id:
        logger.warning("since_id {} is out of range of max_id {} in get_tweets_for_column - it should be a lower number!")
        return None

    queryset = apply_tweet_filter_criteria(social_column, queryset)

    return queryset.order_by("-tweet_id").values()


def get_tweets_for_column(social_column, since_id=None, max_id=None, startIndex=None, stopIndex=None, limit=None):
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

    if limit is not None:
        return tweets[:int(limit)]
    elif startIndex is not None and stopIndex is not None:
        # FIXME Work out why the very end of a column is not returning the last tweet. Add +1 for now to hackily work around it.
        # logger.info("col {}: startIndex = {}, stopIndex = {}, len = {}".format(social_column.id, startIndex, stopIndex, len(t)))
        return tweets[int(startIndex):int(stopIndex) + 1]
    else:
        return tweets


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

            cols = get_columns_for_tweet(tweet)
            if len(cols) > 0:
                response["columnIds"][tweet.tweet_id] = cols

        websockets.send_channel_message("tweets.new_tweets", response)


def get_columns_for_tweet(tweet):
    matchedColumnIds = []
    for column in get_social_columns_cached(SocialPlatformChoice.TWITTER):
        if is_tweet_in_column(tweet.data, column) is True:
            matchedColumnIds.append(column.id)
    return matchedColumnIds


def notify_of_saved_tweet(tweet):
    notify_of_saved_tweets([tweet])


def get_twitter_columns():
    cols = get_social_columns(SocialPlatformChoice.TWITTER).all()
    return SocialColumnsSerializerWithTweetCountSerializer(cols, many=True).data


def get_tweets_by_ids(tweetIds):
    return Tweets.objects.filter(tweet_id__in=tweetIds).values()


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
    tweetsByAge = sorted(tweets, key=lambda t: t.tweet_id, reverse=True)

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
    return "in_reply_to_status_id_str" in status and status["in_reply_to_status_id_str"] is not None


def get_tweet_from_db(tweetId):
    tweet = get_or_none(Tweets, tweet_id=tweetId)
    if tweet is not None:
        return tweet
    else:
        logger.debug("Does not exist locally! ({})".format(tweetId))
        return None


def get_status_from_db(tweetId):
    tweet = get_tweet_from_db(tweetId)
    if tweet is not None:
        return tweet.data
    else:
        return None


def get_status_from_api(tweetId):
    try:
        api = get_tweepy_api_auth()
        status = api.get_status(tweetId, tweet_mode="extended", include_entities=True)
        return status._json
    except tweepy.TweepError as e:
        if e.api_code == 144:
            # Tweet doesn't exist - if it existed, it was probably deleted)
            logger.warning("Does not exist remotely in get_status_from_api! ({})".format(tweetId))
            raise ScremsongException("Does not exist remotely in get_status_from_api! ({})".format(tweetId))
        else:
            # Uh oh, some other error code was returned
            # NB: tweepy.api can return certain errors via retry_errors
            logger.error("TweepError from get_status_from_api({})".format(tweetId), e)
            raise ScremsongException("TweepError from get_status_from_api({})".format(tweetId))
    return None


def resolve_tweet_parents(status, tweets=[], depth=0, maxDepth=25):
    # We did it, we found the absolute parent tweet (the one which was not in reply to anything)
    if is_a_reply(status) is False:
        return tweets, status

    parent = get_status_from_db(status["in_reply_to_status_id_str"])
    if parent is None:
        parent = get_status_from_api(status["in_reply_to_status_id_str"])
        tweet, created = save_tweet(parent, source=TweetSource.THREAD_RESOLUTION, status=TweetStatus.OK)
        logger.info("Cached {} locally (created={})".format(parent["id_str"], created))

    if parent is not None:
        tweets.append(parent)

        depth += 1
        if depth >= maxDepth:
            logger.warning("Got max depth for {}".format(status["in_reply_to_status_id_str"]))
            raise FailedToResolveTweet("Reached maxDepth {} for tweet {} while trying to resolve parents".format(maxDepth, status["in_reply_to_status_id_str"]))

        return resolve_tweet_parents(parent, tweets, depth, maxDepth)
    else:
        raise FailedToResolveTweet("Couldn't find a parent for tweet {}".format(status["in_reply_to_status_id_str"]))


def resolve_tweet_thread_for_parent(parent):
    replies = get_status_replies(parent)
    relationships = build_relationships(replies)

    # Collect up Django Tweet objects to send back up
    tweets = {}

    tweets[parent["id_str"]] = TweetsSerializer(get_tweet_from_db(parent["id_str"])).data

    # Replies are already saved by local caching in the get_status_replies() call stack
    for tweet in Tweets.objects.filter(tweet_id__in=[t["id_str"] for t in replies]).all():
        tweets[tweet.tweet_id] = TweetsSerializer(tweet).data

    return tweets[parent["id_str"]], tweets, relationships


def get_status_replies(parentStatus):
    def resolve_tweet_children(tweetId, replies=[], depth=0, maxDepth=500):
        """A high max depth is OK because this is never hits an API."""
        filtered = Tweets.objects.filter(tweet_id__gt=tweetId).filter(data__in_reply_to_status_id_str=tweetId).values_list("data", flat=True)

        if len(filtered) > 0:
            replies += filtered
            logger.info("{} replies found to {}".format(len(filtered), tweetId))

            depth += 1
            if depth >= maxDepth:
                logger.warning("Got max depth for {}".format(tweetId))
                return replies

            for reply in filtered:
                replies = resolve_tweet_children(reply["id_str"], replies, depth, maxDepth)
            return replies
        else:
            # We've reached the bottom - there are no more replies!
            logger.info("We've reached bottom at {}!".format(tweetId))
            return replies

    if is_a_reply(parentStatus) is True:
        raise ScremsongException("get_status_replies got passed a non-parent tweet {}".format(parentStatus["id_str"]))

    logger.info("Looking for locally cached replies to parent tweet {}".format(parentStatus["id_str"]))
    replies = resolve_tweet_children(parentStatus["id_str"])
    logger.info("Found {} replies to {}".format(len(replies), parentStatus["id_str"]))
    return replies


def build_relationships(replies):
    relationships = [{t["id_str"]: t["in_reply_to_status_id_str"]} for t in replies]
    # Sort by the key of each dict (the reply tweet) to ensure we keep chronological order
    return sorted(relationships, key=lambda k: list(k.keys())[0])


def process_new_tweet_reply(status, tweetSource, sendWebSocketEvent):
    # Deal with tweets arriving / being processed out of order.
    # If it's already part of an assignment then it's been processed and clients have been notified.
    if is_tweet_part_of_an_assignment(status["id_str"]) is True:
        logger.warning("Got tweet {} that was already part of an assignment (process_new_tweet_reply)".format(status["id_str"]))
        # Only send a web socket event if we're not handling this elsewhere (e.g. backfilling)
        if sendWebSocketEvent is True:
            notify_of_saved_tweet(get_tweet_from_db(status["id_str"]))
        return True

    # OK! This means that this is a newly arrived tweet, so we need to work out if it's part of an already existing assignment.

    # Start by saving the tweet as dirty (i.e. we need it in the database for thread resolution, but haven't finished processing it yet)
    tweet, created = save_tweet(status, source=tweetSource, status=TweetStatus.DIRTY)

    try:
        parents, parent = resolve_tweet_parents(status)

        # If the parent is tweet is part of an assignment then we need to go and
        # run a refresh to get us all new replies in the thread.
        # This gets us replies that we don't get via the stream, as well as our own replies.
        if is_tweet_part_of_an_assignment(parent["id_str"]) is True:
            parent, tweets, relationships = resolve_tweet_thread_for_parent(parent)
            replyTweetIds = [tweetId for tweetId in list(tweets.keys()) if tweetId != parent["data"]["id_str"]]

            assignment, created = SocialAssignments.objects.update_or_create(
                platform=SocialPlatformChoice.TWITTER, social_id=parent["data"]["id_str"], defaults={"thread_relationships": relationships, "thread_tweets": replyTweetIds, "last_updated_on": timezone.now()}
            )

            # Adding a new tweet marks the assignment "unread"
            logger.info("Processing tweet {}: Assignment.status = {} ({})".format(status["id_str"], assignment.status, assignment.status == SocialAssignmentStatus.DONE, assignment.status == SocialAssignmentStatus.AWAIT_REPLY))
            if assignment.status == SocialAssignmentStatus.DONE:
                logger.info("Processing tweet {}: Set it to pending".format(status["id_str"]))
                assignment.status = SocialAssignmentStatus.PENDING
                assignment.save()

                websockets.send_user_channel_message("notifications.send", {
                    "message": "One of your completed assignments has had a new reply arrive - it's been marked as pending again",
                    "options": {
                        "variant": NotificationVariants.INFO
                    }
                },
                    assignment.user.username)

            elif assignment.status == SocialAssignmentStatus.AWAIT_REPLY:
                logger.info("Processing tweet {}: Set it to pending".format(status["id_str"]))
                assignment.status = SocialAssignmentStatus.PENDING
                assignment.save()

                websockets.send_user_channel_message("notifications.send", {
                    "message": "One of the assignments you had marked as 'awaiting reply' has had a new reply arrive",
                    "options": {
                        "variant": NotificationVariants.INFO
                    }
                },
                    assignment.user.username)

            else:
                websockets.send_user_channel_message("notifications.send", {
                    "message": "One of your assignments has had a new reply arrive",
                    "options": {
                        "variant": NotificationVariants.INFO
                    }
                },
                    assignment.user.username)

            websockets.send_channel_message("reviewers.assignment_updated", {
                "assignment": SocialAssignmentSerializer(assignment).data,
                "tweets": tweets,
            })

        # Once we're done processing the tweet, or if its parent is not part of an assignment,
        # then we just carry on and save the tweet has processed and send a notification.
        tweet.status = TweetStatus.OK
        tweet.save()
        if sendWebSocketEvent is True:
            notify_of_saved_tweet(tweet)
        return True

    except Exception as e:
        # Mark tweets as dirty if we failed to resolve thread relationships (or if something else terrible happened)
        tweet = Tweets.objects.update_or_create(
            tweet_id=tweet.tweet_id, defaults={"status": TweetStatus.DIRTY}
        )
        raise e

    logger.error("Failed to process new tweet {}".format(status["id_str"]))
    return False


def favourite_tweet(tweetId):
    def ws_send_updated_tweet(tweet):
        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {tweet.tweet_id: TweetsSerializer(tweet).data},
        })

    tweet = Tweets.objects.get(tweet_id=tweetId)

    # The client shouldn't be able to favourite a tweet we've already favourited.
    # Fail quietly and send out new state to all connected clients.
    if tweet.data["favorited"] is True:
        ws_send_updated_tweet(tweet)
        return

    try:
        api = get_tweepy_api_auth()
        status = api.create_favorite(tweetId, include_entities=True)

        tweet.data = status._json
        tweet.save()

        ws_send_updated_tweet(tweet)

    except tweepy.TweepError as e:
        if e.api_code == 139:
            # The tweet was already favourited somewhere else (e.g. another Twitter client). Update local state tweet and respond as if we succeeded.
            tweet.data["favorited"] = True
            tweet.save()

            ws_send_updated_tweet(tweet)
        else:
            # Uh oh, some other error code was returned
            # NB: tweepy.api can return certain errors via retry_errors
            raise e


def unfavourite_tweet(tweetId):
    def ws_send_updated_tweet(tweet):
        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {tweet.tweet_id: TweetsSerializer(tweet).data},
        })

    tweet = Tweets.objects.get(tweet_id=tweetId)

    # The client shouldn't be able to favourite a tweet we've already favourited.
    # Fail quietly and send out new state to all connected clients.
    if tweet.data["favorited"] is False:
        ws_send_updated_tweet(tweet)
        return

    try:
        api = get_tweepy_api_auth()
        status = api.destroy_favorite(tweetId, include_entities=True)

        tweet.data = status._json
        tweet.save()

        ws_send_updated_tweet(tweet)

    except tweepy.TweepError as e:
        if e.api_code == 144:
            # The tweet was already unfavourited somewhere else (e.g. another Twitter client). Update local state tweet and respond as if we succeeded.
            # NB: No idea why they use 144 as the response code. 144 is supposed to be "No status found with that ID"
            tweet.data["favorited"] = False
            tweet.save()

            ws_send_updated_tweet(tweet)
        else:
            # Uh oh, some other error code was returned
            # NB: tweepy.api can return certain errors via retry_errors
            raise e


def retweet_tweet(tweetId):
    def ws_send_updated_tweet(tweet):
        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {tweet.tweet_id: TweetsSerializer(tweet).data},
        })

    tweet = Tweets.objects.get(tweet_id=tweetId)

    # The client shouldn't be able to retweet a tweet they've already retweeted.
    # Fail quietly and send out new state to all connected clients.
    if tweet.data["retweeted"] is True:
        ws_send_updated_tweet(tweet)
        return

    try:
        api = get_tweepy_api_auth()
        status = api.retweet(tweetId)

        tweet.data = status._json["retweeted_status"]
        tweet.save()

        retweet, created = save_tweet(status._json, source=TweetSource.RETWEETING, status=TweetStatus.OK)

        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {tweet.tweet_id: TweetsSerializer(tweet).data, retweet.tweet_id: TweetsSerializer(retweet).data},
        })

    except tweepy.TweepError as e:
        if e.api_code == 327:
            # The tweet was already retweeted somewhere else (e.g. another Twitter client). Update local state tweet and respond as if we succeeded.
            tweet.data["retweeted"] = True
            tweet.save()

            ws_send_updated_tweet(tweet)
        else:
            # Uh oh, some other error code was returned
            # NB: tweepy.api can return certain errors via retry_errors
            raise e


def unretweet_tweet(tweetId):
    def ws_send_updated_tweet(tweet):
        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {tweet.tweet_id: TweetsSerializer(tweet).data},
        })

    tweet = Tweets.objects.get(tweet_id=tweetId)

    # The client shouldn't be able to retweet a tweet they've already retweeted.
    # Fail quietly and send out new state to all connected clients.
    if tweet.data["retweeted"] is False:
        ws_send_updated_tweet(tweet)
        return

    try:
        api = get_tweepy_api_auth()
        status = api.unretweet(tweetId)

        tweet.data = status._json
        tweet.save()

        ws_send_updated_tweet(tweet)

    except tweepy.TweepError as e:
        raise e

        if e.api_code == 327:
            # The tweet was already retweeted somewhere else (e.g. another Twitter client). Update local state tweet and respond as if we succeeded.
            tweet.data["retweeted"] = False
            tweet.save()

            ws_send_updated_tweet(tweet)
        else:
            # Uh oh, some other error code was returned
            # NB: tweepy.api can return certain errors via retry_errors
            raise e


def reply_to_tweet(inReplyToTweetId, replyText):
    try:
        api = get_tweepy_api_auth()
        status = api.update_status(status=replyText, in_reply_to_status_id=inReplyToTweetId)

        reply, created = save_tweet(status._json, source=TweetSource.REPLYING, status=TweetStatus.OK)

        websockets.send_channel_message("tweets.update_tweets", {
            "tweets": {reply.tweet_id: TweetsSerializer(reply).data},
        })

    except tweepy.RateLimitError as e:
        logger.warning("Got a RateLimitError from Tweepy while sending a reply to {}".format(inReplyToTweetId))
        raise e

    except tweepy.TweepError as e:
        logger.warning("Got a TweepError {} from Tweepy while sending a reply to {}".format(e.api_code, inReplyToTweetId))
        raise e


def get_precanned_tweet_replies():
    replies = {}

    for reply in TweetReplies.objects.filter(category__isnull=False):
        if reply.category not in replies:
            replies[reply.category] = []
        replies[reply.category].append(reply.reply_text)

    return replies
