from __future__ import absolute_import, unicode_literals
import os
from time import sleep
from celery import Celery
from celery.signals import celeryd_init, worker_ready, worker_shutting_down, worker_process_shutdown, worker_shutdown
from scremsong.util import make_logger
from scremsong.app import websockets
from scremsong.app.enums import NotificationVariants

logger = make_logger(__name__)

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proj.settings')

app = Celery('proj')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


def celery_init_tweet_streaming(wait=2):
    if is_streaming_task_running() is False:
        logger.info("Auto-starting tweet streaming in Celery worker")
        task_open_tweet_stream.apply_async(countdown=wait)
    else:
        logger.info("Not starting tweet streaming - it already exists")


# def celery_kill_running_streaming_tasks():
#     from celery.task.control import revoke

#     tasks = get_tweet_streaming_tasks(activeOnly=False)
#     for task in tasks:
#         if task["acknowledged"] is True:
#             # This is bad - per advice about terminate=True potentially killing the process when it's begun another task
#             # http://docs.celeryproject.org/en/latest/userguide/workers.html?highlight=revoke#revoke-revoking-tasks
#             # Not an issue for us with how we're using Celery at the moment.
#             # A better approach is using AbortableTasks and testing for is_aborted() in the task and here.
#             # (See the commit history on this file for WIPy attempts at doing that)
#             logger.info("Revoking acknowledged task {} ({}) on worker {}".format(task["name"], task["id"], task["hostname"]))
#             revoke(task["id"], terminate=True)
#         else:
#             logger.info("Revoking unacknowledged task {} ({}) on worker {}".format(task["name"], task["id"], task["hostname"]))
#             revoke(task["id"])

#     # Give the tasks time to properly die
#     sleep(5)


def celery_restart_streaming(wait=5):
    # Stop any running streaing tasks before we try to restart
    # e.g. If streaming dies soon after it's connected then task_fill_missing_tweets may still be running
    # logger.info("Trying to kill any running tweet streaming tasks")
    # celery_kill_running_streaming_tasks()

    # logger.info("Trying to restart tweet streaming")
    # celery_init_tweet_streaming(wait)

    # logger.info("Launching restart tweet streaming task")
    # task_restart_streaming.apply_async(countdown=wait)

    # Relies on supervisord (in PROD) restarting the worker for us
    logger.info("Attempting to restart streaming by shutting down the celery worker")
    shutdown_celery_worker()


def get_celery_tasks(activeOnly=True):
    from celery.task.control import inspect
    i = inspect()

    allTasks = []

    # Return in reverse order so that we can revoke tasks that haven't been started yet first
    if activeOnly is False:
        reserved = i.reserved()
        if reserved is not None:
            for worker_name, tasks in reserved.items():
                allTasks += tasks

        scheduled = i.scheduled()
        if scheduled is not None:
            for worker_name, tasks in scheduled.items():
                allTasks += tasks

    active = i.active()
    if active is not None:
        for worker_name, tasks in active.items():
            allTasks += tasks

    return allTasks


def get_tweet_streaming_tasks(activeOnly=True):
    tasks = get_celery_tasks(activeOnly)
    streamingTaskNames = ["scremsong.celery.task_open_tweet_stream", "scremsong.celery.task_fill_missing_tweets"]
    tweetStreamingTasks = []

    for task in tasks:
        if task["name"] in streamingTaskNames:
            tweetStreamingTasks.append(task)
    return tweetStreamingTasks


def is_streaming_task_running():
    for task in get_tweet_streaming_tasks(activeOnly=True):
        if task["name"] == "scremsong.celery.task_open_tweet_stream":
            return True
    return False


def shutdown_celery_worker():
    from celery.task.control import inspect, broadcast
    i = inspect()

    logger.info("Attempting to shutdown celery worker")

    workers = i.ping()
    if workers is not None:
        for worker_name, ok in workers.items():
            logger.info("Shutting down Celery worker {} ({})".format(worker_name, ok))
            broadcast("shutdown", destination=[worker_name])
    else:
        logger.info("No workers are visible")


@celeryd_init.connect
def configure_workers(sender=None, conf=None, **kwargs):
    from celery.task.control import inspect
    i = inspect()

    logger.info("Celery worker {} has started.".format(sender))

    # Report on what the task queue looks like
    tasks = get_celery_tasks(activeOnly=True)
    logger.info("Running tasks in queue: {}".format(len(tasks)))
    tasks = get_celery_tasks(activeOnly=False)
    logger.info("Total tasks in queue: {}".format(len(tasks)))
    tasks = get_tweet_streaming_tasks(activeOnly=True)
    logger.info("Running treaming tasks in queue: {}".format(len(tasks)))
    tasks = get_tweet_streaming_tasks(activeOnly=False)
    logger.info("Total streaming tasks in queue: {}".format(len(tasks)))

    # Stop any running tasks before we try to kill our workers
    # celery_kill_running_streaming_tasks()

    # Shutdown any existing workers before our new worker connects
    shutdown_celery_worker()

    # Give the workers time to properly die
    sleep(2)


@worker_ready.connect
def worker_ready(sender, **kwargs):
    celery_init_tweet_streaming()
    return True


@worker_process_shutdown.connect
def worker_process_shutdown(sender, pid, exitcode, **kwargs):
    logger.info("Worker {} got worker_process_shutdown. Pid: {}, Exit code: {}".format(sender, pid, exitcode))
    return True


@worker_shutting_down.connect
def worker_shutting_down(sender, sig, how, exitcode, **kwargs):
    logger.info("Worker {} got worker_shutting_down. Sig: {}, How: {}, Exit code: {}".format(sender, sig, how, exitcode))
    return True


@worker_shutdown.connect
def worker_shutdown(sender, **kwargs):
    logger.info("Worker {} got worker_shutdown.".format(sender))
    return True


@app.task(bind=True)
def task_open_tweet_stream(self):
    from scremsong.app.twitter_streaming import open_tweet_stream
    open_tweet_stream()

    logger.info("Unexpectedly done streaming tweets!")

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

    return True


# @app.task(bind=True)
# def task_restart_streaming(self, reason=None):
#     logger.info("Trying to restart streaming. Reason: ".format(reason))

#     # Stop any running streaing tasks before we try to restart
#     # e.g. If streaming dies soon after it's connected then task_fill_missing_tweets may still be running
#     # logger.info("Trying to kill any running tweet streaming tasks")
#     # celery_kill_running_streaming_tasks()

#     # And restart!
#     # logger.info("Trying to retstart tweet streaming tasks")
#     # celery_init_tweet_streaming()

#     return True


@app.task(bind=True)
def task_fill_missing_tweets(self, since_id):
    logger.info("Initialising task_fill_missing_tweets for {}".format(since_id))

    from scremsong.app.twitter import get_next_tweet_id_for_streaming, fill_in_missing_tweets

    if since_id is None:
        logger.info("There's no tweets in the database - skipping filling in missing tweets")
        return True

    # We have to wait until streaming starts AND we receive a tweet to fill in the gaps - otherwise we won't know when to stop filling in the gaps.
    # NB: Well I guess we could take a few "tweet already exists in table" errors in a row as a sign that we're there?
    max_id = None
    while max_id is None:
        max_id = get_next_tweet_id_for_streaming(since_id)

        if max_id is not None:
            # Get everything except max_id itself (because we already have it, duh)
            max_id = str(int(max_id) - 1)

            logger.info("Auto-starting filling in missing tweets since {} and until {} in Celery worker".format(since_id, max_id))
            tweets_added = fill_in_missing_tweets(since_id, max_id)
            logger.info("Filled in {} missing tweets in total".format(tweets_added))
        else:
            # logger.info("Waiting for streaming to start until we can fill missing tweets...")
            sleep(5)

    logger.info("Done filling missing tweets!")
    return True


@app.task(bind=True)
def task_process_tweet_reply(self, status, tweetSource, sendWebSocketEvent):
    from scremsong.app.twitter import is_a_reply, notify_of_saved_tweet, save_tweet, process_new_tweet_reply
    from scremsong.app.enums import TweetSource, TweetStatus
    from scremsong.app.exceptions import ScremsongException
    logger.info("Started processing tweet {} from {}".format(status["id_str"], tweetSource))

    try:
        if is_a_reply(status) is False:
            logger.info("Saving tweet {}".format(status["id_str"]))
            tweet, created = save_tweet(status, source=TweetSource.STREAMING, status=TweetStatus.OK)
            notify_of_saved_tweet(tweet)
        else:
            logger.info("Processing tweet {} from streaming".format(status["id_str"]))
            process_new_tweet_reply(status, tweetSource, sendWebSocketEvent)
    except ScremsongException as e:
        logger.error("Celery task could not process tweet {}. Failed to resolve and update tweet thread. Message: {}".format(status["id_str"], str(e)))
    except Exception as e:
        logger.error("Celery task could not process tweet {}. Failed for an unknown reason. Message: {}".format(status["id_str"], str(e)))

    return True
