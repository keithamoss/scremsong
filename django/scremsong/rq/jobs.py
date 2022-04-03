from time import sleep

from django_rq import job
from scremsong.app import websockets
from scremsong.app.enums import NotificationVariants, TwitterRateLimitState
from scremsong.rq.rq_utils import (cancel_jobs, get_started_jobs_by_func_names,
                                   log_task_debug_info)
from scremsong.util import make_logger

from rq import Retry, get_current_job

logger = make_logger(__name__)


@job("high", timeout=30, retry=Retry(max=3, interval=[10, 30, 60]))
def task_cancel_and_restart_tweet_streaming():
    logger.info(f"Starting task_cancel_and_restart_tweet_streaming")

    # First we'll wait for a bit to allow any other tasks calling this to exit gracefully (e.g. Tweet sreaming)
    sleep(3)

    task_cancel_tweet_streaming.delay()
    task_restart_tweet_streaming.delay()
    return None


@job("high", timeout=30, retry=Retry(max=3, interval=[10, 30, 60]))
def task_cancel_tweet_streaming():
    logger.info(f"Starting task_cancel_tweet_streaming")

    found_jobs = get_started_jobs_by_func_names(func_names=["task_open_tweet_stream", "task_fill_missing_tweets", "task_collect_twitter_rate_limit_info"])
    logger.info("found_jobs is...")
    logger.info(found_jobs)

    logger.info("Canncelling found_jobs")
    cancel_jobs(found_jobs)

    found_jobs_after_cancel = get_started_jobs_by_func_names(func_names=["task_open_tweet_stream", "task_fill_missing_tweets", "task_collect_twitter_rate_limit_info"])
    logger.info("found_jobs_after_cancel is now...")
    logger.info(found_jobs_after_cancel)

    return [job.id for job in found_jobs]


@job("high", timeout=30, retry=Retry(max=3, interval=[10, 30, 60]))
def task_restart_tweet_streaming():
    logger.info(f"Starting task_restart_tweet_streaming")

    # Give time for supervisord to bring workers up if we're from init.py
    # And this won't hurt anywhere else that needs to give time for jobs to cancel.
    logger.info("Waiting to start tweet streaming")
    sleep(10)

    job1 = task_open_tweet_stream.delay()

    logger.info("Starting Twitter rate limit info collection")
    job2 = task_collect_twitter_rate_limit_info.delay()

    # Give time for the jobs to be registered so the job ids get logged to the database
    sleep(5)

    return {"task_open_tweet_stream": job1.id if job1 is not None else None, "task_collect_twitter_rate_limit_info": job2.id if job2 is not None else None}


@job("default", timeout=-1, retry=Retry(max=10, interval=[5, 10, 15]), meta={"_ensure_task_is_unique": True})
def task_open_tweet_stream():
    log_task_debug_info(get_current_job())

    from scremsong.app.twitter_streaming import open_tweet_stream

    # Dies with an exception if the stream stops unexpectedly
    open_tweet_stream()


@job("default", timeout=-1, retry=Retry(max=10, interval=[5, 10, 15]), meta={"_scremsong_job_name": "task_fill_missing_tweets_{sinceId}", "_ensure_task_is_unique": True})
def task_fill_missing_tweets(sinceId):
    log_task_debug_info(get_current_job())

    if sinceId is None:
        logger.warning("There's no tweets in the database - skipping filling in missing tweets. We need both a start and end tweet to be able to backfill.")
        return True

    from scremsong.app.twitter import (fill_in_missing_tweets,
                                       get_next_tweet_id_for_streaming)

    logger.info("Commence waiting for a tweet to be sent. We need both a start and end tweet to be able to backfill.")

    # We have to wait until streaming starts AND we receive a tweet to fill in the gaps - otherwise we won't know when to stop filling in the gaps.
    # NB: Well I guess we could take a few "tweet already exists in table" errors in a row as a sign that we're there?
    max_id = None
    while max_id is None:
        max_id = get_next_tweet_id_for_streaming(sinceId)

        if max_id is not None:
            # Get everything except max_id itself (because we already have it, duh)
            max_id = str(int(max_id) - 1)

            logger.info("Auto-starting filling in missing tweets since {} and until {} in task".format(sinceId, max_id))
            tweets_added = fill_in_missing_tweets(sinceId, max_id)
            logger.info("Filled in {} missing tweets in total".format(tweets_added))
        else:
            # logger.info("Waiting for streaming to start until we can fill missing tweets...")
            sleep(5)

    logger.info("Done filling missing tweets for {}".format(sinceId))

    logger.info("Deleting sinceId {} from TaskFillMissingTweets".format(sinceId))
    from scremsong.app.models import TaskFillMissingTweets
    t = TaskFillMissingTweets.objects.filter(since_id=sinceId)
    t.delete()
    logger.info("There are now {} sinceIds remaining in TaskFillMissingTweets".format(TaskFillMissingTweets.objects.count()))

    return True


@job("high", timeout=15, retry=Retry(max=3, interval=[5, 10, 15]))
def task_process_tweet_reply(status, tweetSource, sendWebSocketEvent):
    from scremsong.app.enums import TweetSource, TweetStatus
    from scremsong.app.exceptions import ScremsongException
    from scremsong.app.twitter import (is_a_reply, notify_of_saved_tweet,
                                       process_new_tweet_reply, save_tweet)
    logger.info("Started processing tweet {} from {}".format(status["id_str"], tweetSource))

    try:
        if is_a_reply(status) is False:
            logger.debug("Saving tweet {}".format(status["id_str"]))
            tweet, created = save_tweet(status, source=TweetSource.STREAMING, status=TweetStatus.OK)
            notify_of_saved_tweet(tweet)
        else:
            logger.debug("Processing tweet {} from streaming".format(status["id_str"]))
            process_new_tweet_reply(status, tweetSource, sendWebSocketEvent)
    except ScremsongException as e:
        logger.info("Task could not process tweet {}. Failed to resolve and update tweet thread. Message: {}".format(status["id_str"], str(e)))
    except Exception as e:
        logger.info("Task could not process tweet {}. Failed for an unknown reason. Message: {}".format(status["id_str"], str(e)))

    return True


@job("low", timeout=-1, retry=Retry(max=10, interval=[5, 10, 15]), meta={"_ensure_task_is_unique": True})
def task_collect_twitter_rate_limit_info():
    log_task_debug_info(get_current_job())

    # logger.warning("task_collect_twitter_rate_limit_info() is disabled when an election is not running")
    # return True

    from scremsong.app.models import TwitterRateLimitInfo
    from scremsong.app.twitter import are_we_rate_limited, get_tweepy_api_auth

    api = get_tweepy_api_auth()

    while True:
        status = api.rate_limit_status()
        resources = status["resources"]
        r = TwitterRateLimitInfo(data=resources)
        r.save()

        websockets.send_channel_message("tweets.rate_limit_resources", {
            "resources": resources,
        })

        rateLimitedResources = are_we_rate_limited(resources, bufferPercentage=0.2)

        if len(rateLimitedResources.keys()) > 0:
            resourceNames = [resource_name for resource_name in rateLimitedResources.keys()]

            websockets.send_channel_message("notifications.send", {
                "message": "We've been rate limited by Twitter for {}.".format(", ".join(resourceNames)),
                "options": {
                    "variant": NotificationVariants.ERROR,
                    "autoHideDuration": 20000,
                }
            })

            websockets.send_channel_message("tweets.rate_limit_state", {
                "state": TwitterRateLimitState.RATE_LIMITED,
            })

            logger.info("We've been rate limited by Twitter for {}.".format(", ".join(resourceNames)))

        else:
            rateLimitedResources = are_we_rate_limited(resources, bufferPercentage=0.20)

            if len(rateLimitedResources.keys()) > 0:
                websockets.send_channel_message("notifications.send", {
                    "message": "Twitter rate limit approaching for {}.".format(", ".join(resourceNames)),
                    "options": {
                        "variant": NotificationVariants.WARNING,
                        "autoHideDuration": 20000,
                    }
                })

                websockets.send_channel_message("tweets.rate_limit_state", {
                    "state": TwitterRateLimitState.WARNING,
                })

                logger.info("Twitter rate limit approaching for {}.".format(", ".join(resourceNames)))

            else:
                websockets.send_channel_message("tweets.rate_limit_state", {
                    "state": TwitterRateLimitState.EVERYTHING_OK,
                })

                logger.info("Twitter rate limit = everything is fine here, we're all fine here, how are you?")

        sleep(30)

    raise Exception("Unexpectedly done collecting Twitter rate limit info!")
