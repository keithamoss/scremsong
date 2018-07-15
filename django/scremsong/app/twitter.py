import tweepy
from scremsong.util import make_logger, get_env
import os
import uuid
import datetime
import pytz
import json
from scremsong.app.models import SocialPlatforms, SocialPlatformChoice, Tweets

logger = make_logger(__name__)


def get_uuid():
    if os.path.isfile("/app/uuid"):
        with open("/app/uuid") as f:
            return f.read()
    return None


def make_app_uuid():
    if get_uuid() is None:
        with open("/app/uuid", "w") as f:
            f.write(str(uuid.uuid4()))
        return True


def get_twitter_app():
    return SocialPlatforms.objects.filter(platform=SocialPlatformChoice.TWITTER).first()


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


def social_log_message(message):
    t = get_twitter_app()
    timestamp = datetime.datetime.utcnow().astimezone(pytz.timezone("Australia/Perth")).replace(microsecond=0).isoformat()
    t.log.append({"timestamp": timestamp, "message": message})
    t.save()
    logger.warn(message)


def social_log_error(message):
    t = get_twitter_app()
    timestamp = datetime.datetime.utcnow().astimezone(pytz.timezone("Australia/Perth")).replace(microsecond=0).isoformat()
    t.errors.append({"timestamp": timestamp, "message": message})
    t.save()
    logger.error(message)


def fill_in_missing_tweets():
    last_tweet = Tweets.objects.filter().latest("id")

    auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
    auth.set_access_token(get_env("TWITTER_ACCESS_TOKEN"), get_env("TWITTER_ACCESS_TOKEN_SECRET"))
    api = tweepy.API(auth)

    count = 0
    for status in tweepy.Cursor(api.search, q="#AFLNorthSwans", result_type="recent", tweet_mode="extended", since_id=last_tweet.id).items():
        t = Tweets(id=status.id_str, data=status._json)
        t.save()
        count += 1
    return last_tweet.id, count


def open_tweet_stream():
    # https://stackoverflow.com/a/33660005/7368493
    class MyStreamListener(tweepy.StreamListener):
        def __init__(self, foo=60):
            self.app_uuid = get_uuid()
            self.pid = os.getpid()

            # Make us the active app now. This will let the other app know to disconnect from the stream.
            t = get_twitter_app()
            t.active_app_uuid = self.app_uuid
            t.pid = self.pid
            t.save()

            super(MyStreamListener, self).__init__()

        def on_data(self, data):
            t = get_twitter_app()
            if self.app_uuid is not None and self.app_uuid != t.active_app_uuid and t.pid != self.pid:
                social_log_message("{} disconnecting ({} (pid={}) is the active app now)".format(self.app_uuid, t.active_app_uuid, t.pid))
                return False

            return super(MyStreamListener, self).on_data(data)

        def on_status(self, status):
            t = Tweets(id=status.id_str, data=status._json)
            t.save()
            print(">>>", status.text)

        def on_error(self, status_code):
            if status_code == 420:
                # Returning False in on_error disconnects the stream
                social_log_message("Streaming got status {}. Disconnecting from stream. ({})".format(status_code, self.app_uuid))
                return False
            social_log_message("Streaming got status {}. Taking no action.".format(status_code))

        def on_limit(self, track):
            social_log_message("Received an on limit message from Twitter. ({})".format(self.self.app_uuid))
            pass

        def on_timeout(self):
            social_log_error("Streaming connection to Twitter has timed out ({}).".format(self.self.app_uuid))
            pass

        def on_disconnect(self, notice):
            social_log_error("Received a disconnect notice from Twitter ({}). {}".format(self.self.app_uuid, notice))
            pass

        def on_warning(self, notice):
            social_log_error("Received disconnection warning notice from Twitter ({}). {}".format(self.self.app_uuid, notice))
            pass

    t = get_twitter_app()
    if t.credentials is not None and "access_token" in t.credentials and "access_token_secret" in t.credentials:
        try:
            t = get_twitter_app()

            # Do nothing if an existing thread for this app has already started a stream
            if t.active_app_uuid == get_uuid() and t.pid is not None and t.pid != os.getpid():
                logger.warn("Skipping connecting to the tweet stream for pid {}".format(os.getpid()))
                return

            # Fill in gaps in tweets since the last tweet we added
            since_id, count = fill_in_missing_tweets()
            social_log_message("Filled in {} missing tweets since_id {}".format(count, since_id))

            auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
            auth.set_access_token(t.credentials["access_token"], t.credentials["access_token_secret"])
            api = tweepy.API(auth)

            myStreamListener = MyStreamListener()
            myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)
            myStream.filter(track=["#AFLNorthSwans"], async=True)
            social_log_message("Streaming Twitter connection establised successfully.")
        except Exception as e:
            logger.error(str(e))
    else:
        social_log_error("No Twitter credentials available! Please generate them by-hand.")
