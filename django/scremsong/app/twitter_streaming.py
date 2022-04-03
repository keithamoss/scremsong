import tweepy
from scremsong.app import websockets
from scremsong.app.enums import (NotificationVariants, SocialPlatformChoice,
                                 TweetSource)
from scremsong.app.models import SocialPlatforms
from scremsong.app.social.columns import get_social_columns
from scremsong.app.twitter import (get_latest_tweet_id_for_streaming,
                                   get_tweepy_api_creds, get_twitter_app)
from scremsong.rq.jobs import (task_cancel_and_restart_tweet_streaming,
                               task_fill_missing_tweets,
                               task_process_tweet_reply)
from scremsong.util import make_logger

logger = make_logger(__name__)


def open_tweet_stream():
    # https://stackoverflow.com/a/33660005/7368493
    class ScremsongStream(tweepy.Stream):
        def on_status(self, status):
            logger.debug("Sending tweet {} to the queue to be processed from streaming".format(status._json["id_str"]))
            task_process_tweet_reply.delay(status._json, TweetSource.STREAMING, True)

        def on_request_error(self, status_code):
            if status_code == 420:
                logger.warning("Streaming got status {}. Disconnecting from stream.".format(status_code))

                task_cancel_and_restart_tweet_streaming.delay()

                # Returning False in on_request_error disconnects the stream
                return False
            # Returning non-False reconnects the stream, with backoff
            logger.warning("Streaming got status {}. Taking no action.".format(status_code))

        def on_limit(self, track):
            logger.warning("Received an on limit message from Twitter.")

        def on_connection_error(self):
            logger.critical("Streaming connection to Twitter has timed out.")

            task_cancel_and_restart_tweet_streaming.delay()

            # Returning False in on_connection_error disconnects the stream
            return False

        def on_disconnect_message(self, notice):
            """Called when twitter sends a disconnect notice

            Disconnect codes are listed here:
            https://dev.twitter.com/docs/streaming-apis/messages#Disconnect_messages_disconnect
            """

            logger.critical("Received a disconnect notice from Twitter: {}".format(notice))

            task_cancel_and_restart_tweet_streaming.delay()

            # Returning False in on_disconnect_message disconnects the stream
            return False

        def on_warning(self, notice):
            logger.critical("Received disconnection warning notice from Twitter. {}".format(notice))

        def on_connect(self):
            logger.info("on_connect")

            websockets.send_channel_message("notifications.send", {
                "message": "Real-time tweet streaming has connected.",
                "options": {
                    "variant": NotificationVariants.INFO
                }
            })
            websockets.send_channel_message("tweets.streaming_state", {
                "connected": True,
            })

        def on_data(self, raw_data):
            logger.info("on_data")
            return super(ScremsongStream, self).on_data(raw_data)

        def on_delete(self, status_id, user_id):
            """Called when a delete notice arrives for a status"""
            logger.warning("on_delete: {}, {}".format(status_id, user_id))
            return

        def on_keep_alive(self):
            """Called when a keep-alive arrived"""
            logger.info("on_keep_alive")
            return

    # Create Twitter app credentials + config store if it doesn't exist
    t = get_twitter_app()
    if t is None:
        t = SocialPlatforms(platform=SocialPlatformChoice.TWITTER)
        t.save()
        t = get_twitter_app()

    # Begin streaming!
    try:
        creds = get_tweepy_api_creds()
        if creds is None:
            logger.critical("No Twitter credentials available! Please generate them by-hand.")
            return None

        stream = ScremsongStream(creds["consumer_key"], creds["consumer_secret"], creds["access_token"], creds["access_token_secret"])

        track = []
        [track.extend(column.search_phrases) for column in get_social_columns(SocialPlatformChoice.TWITTER)]
        if len(track) == 0:
            logger.info("No search phrases are set - we won't try to stream tweets")
        else:
            logger.info("track")
            logger.info(track)

            # Fill in any gaps in tweets since streaming last stopped
            sinceId = get_latest_tweet_id_for_streaming()
            logger.info("Tweet streaming about to start. Queueing up fill in missing tweets task since {}.".format(sinceId))
            if sinceId is not None:
                task_fill_missing_tweets.delay(sinceId=sinceId)
            else:
                logger.warning("Got sinceId of None when trying to start task_fill_missing_tweets")

            # Begin streaming!
            stream.filter(track=track, stall_warnings=True)

            logger.warning("Oops, looks like tweet streaming has ended unexpectedly.")

            websockets.send_channel_message("notifications.send", {
                "message": "Real-time tweet streaming has disconnected.",
                "options": {
                    "variant": NotificationVariants.ERROR,
                    "autoHideDuration": None
                }
            })

            websockets.send_channel_message("tweets.streaming_state", {
                "connected": False,
            })

            task_cancel_and_restart_tweet_streaming.delay()

    except Exception as e:
        logger.error("Exception {}: '{}' during streaming".format(type(e), str(e)))

        websockets.send_channel_message("notifications.send", {
            "message": "Real-time tweet streaming has disconnected (death).",
            "options": {
                "variant": NotificationVariants.ERROR,
                "autoHideDuration": None
            }
        })

        websockets.send_channel_message("tweets.streaming_state", {
            "connected": False,
        })

        raise e
