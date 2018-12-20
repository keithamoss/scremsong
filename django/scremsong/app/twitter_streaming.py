import tweepy
from scremsong.util import make_logger
from scremsong.app.models import SocialPlatforms
from scremsong.app.enums import SocialPlatformChoice
from scremsong.celery import celery_init_tweet_streaming
from scremsong.app.social.columns import get_social_columns
from scremsong.app.twitter import save_tweet, get_twitter_app, get_tweepy_api_auth

logger = make_logger(__name__)


def open_tweet_stream():
    # https://stackoverflow.com/a/33660005/7368493
    class MyStreamListener(tweepy.StreamListener):
        def on_status(self, status):
            save_tweet(status)

        def on_error(self, status_code):
            if status_code == 420:
                logger.warning("Streaming got status {}. Disconnecting from stream.".format(status_code))

                # Fire off tasks to restart streaming (delayed by 2s)
                celery_init_tweet_streaming()

                # Returning False in on_error disconnects the stream
                return False
            logger.warning("Streaming got status {}. Taking no action.".format(status_code))

        def on_limit(self, track):
            logger.warning("Received an on limit message from Twitter.")

        def on_timeout(self):
            logger.critical("Streaming connection to Twitter has timed out.")

            # Fire off tasks to restart streaming (delayed by 2s)
            celery_init_tweet_streaming()

            # Returning False in on_timeout disconnects the stream
            return False

        def on_disconnect(self, notice):
            """Called when twitter sends a disconnect notice

            Disconnect codes are listed here:
            https://dev.twitter.com/docs/streaming-apis/messages#Disconnect_messages_disconnect
            """

            logger.critical("Received a disconnect notice from Twitter. {}".format(notice))

            # Fire off tasks to restart streaming (delayed by 2s)
            celery_init_tweet_streaming()

            # Returning False in on_disconnect disconnects the stream
            return False

        def on_warning(self, notice):
            logger.critical("Received disconnection warning notice from Twitter. {}".format(notice))

        def on_connect(self):
            logger.info("on_connect")

        def on_data(self, raw_data):
            logger.info("on_data")
            return super(MyStreamListener, self).on_data(raw_data)

        def on_delete(self, status_id, user_id):
            """Called when a delete notice arrives for a status"""
            logger.warning("on_delete: {}, {}".format(status_id, user_id))
            return

        def keep_alive(self):
            """Called when a keep-alive arrived"""
            logger.info("keep_alive")
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
            myStream.filter(track=track, stall_warnings=True)
            logger.info("Streaming Twitter connection establised successfully for terms: {}.".format(", ".join(track)))
    except Exception as e:
        logger.error("Exception {}: '{}' during streaming".format(type(e), e))
