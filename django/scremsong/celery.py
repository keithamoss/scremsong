from __future__ import absolute_import, unicode_literals
from scremsong.util import make_logger
import os
from celery import Celery
from celery.signals import celeryd_init, worker_ready
from time import sleep

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


def celery_init_tweet_streaming():
    from scremsong.app.twitter import get_latest_tweet_id

    # Delay by 7s to give streaming time to start up and get the first tweet
    logger.info("Initialising tweet streaming. Queue up fill in missing tweets task.")
    task_fill_missing_tweets.apply_async(args=[get_latest_tweet_id()], countdown=7)

    # Delay by 2s to account for 420 Disconnects
    logger.info("Auto-starting tweet streaming in Celery worker")
    task_open_tweet_stream.apply_async(countdown=2)


def celery_kill_running_tasks():
    from celery.task.control import inspect, revoke
    i = inspect()

    for worker_name, tasks in i.active().items():
        logger.info("Ending tasks for worker {}".format(worker_name))

        for task in tasks:
            # This is bad - per advice about terminate=True potentially killing the process when it's begun another task
            # http://docs.celeryproject.org/en/latest/userguide/workers.html?highlight=revoke#revoke-revoking-tasks
            # Not an issue for us with how we're using Celery at the moment.
            # A better approach is using AbortableTasks and testing for is_aborted() in the task and here.
            # (See the commit history on this file for WIPy attempts at doing that)
            logger.info("Revoking task_id {}".format(task["id"]))
            revoke(task["id"], terminate=True)

    # Give the tasks time to properly die
    sleep(2)


def celery_restart_streaming():
    # Stop any running tasks before we try to restart
    celery_kill_running_tasks()

    # And restart!
    celery_init_tweet_streaming()


@celeryd_init.connect
def configure_workers(sender=None, conf=None, **kwargs):
    from celery.task.control import inspect, broadcast
    i = inspect()
    logger.info("Starting up Celery worker")

    # Stop any running tasks before we try to kill our workers
    celery_kill_running_tasks()

    # Shutdown any existing workers before our new worker connects
    for worker_name, ok in i.ping().items():
        logger.info("Shutting down Celery worker {}".format(worker_name))
        broadcast("shutdown", destination=[worker_name])

    # Give the workers time to properly die
    sleep(2)


@worker_ready.connect
def worker_ready(sender, **kwargs):
    celery_init_tweet_streaming()
    return True


@app.task(bind=True)
def task_open_tweet_stream(self):
    from scremsong.app.twitter import open_tweet_stream
    open_tweet_stream()

    logger.info("Done streaming tweets!")
    return True


@app.task(bind=True)
def task_fill_missing_tweets(self, since_id):
    from scremsong.app.twitter import get_next_tweet_id, fill_in_missing_tweets

    if since_id is None:
        logger.info("There's no tweets in the database - skipping filling in missing tweets")
        return True

    # We have to wait until streaming starts AND we receive a tweet to fill in the gaps - otherwise we won't know when to stop filling in the gaps.
    # NB: Well I guess we could take a few "tweet already exists in table" errors in a row as a sign that we're there?
    max_id = None
    while max_id is None:
        max_id = get_next_tweet_id(since_id)

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
