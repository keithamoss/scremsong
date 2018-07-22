from __future__ import absolute_import, unicode_literals
from scremsong.util import make_logger
import os
from celery import Celery
from celery.contrib.abortable import AbortableTask, AbortableAsyncResult
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


@celeryd_init.connect
def configure_workers(sender=None, conf=None, **kwargs):
    logger.info("Starting up Celery worker {}".format(sender))

    from celery.task.control import inspect, revoke
    i = inspect()
    for worker_name, tasks in i.active().items():
        print(">>>", worker_name)

        for task in tasks:
            print(">>> Revoking {}".format(task["id"]))
            revoke(task["id"], terminate=True)
            print(">>> Revoked")

        # abortable_async_result = AbortableAsyncResult(task["id"])
        # print(">>> Aborting {}".format(task["id"]))
        # abortable_async_result.abort()

        # while not abortable_async_result.is_aborted():
        #     print(">>> Waiting")
        #     sleep(1)
        # print(">>> Aborted")

    print(">>> Sleeping...")
    sleep(2)
    print(">>> Sleeping Done")

    # Shutdown any existing workers before our new worker connects
    from celery.task.control import inspect, broadcast
    i = inspect()
    print(i.ping())

    for worker_name, value in i.ping().items():
        logger.info("Shutting down Celery worker {}".format(worker_name))
        print("Shutting down...")
        broadcast("shutdown", destination=[worker_name])
        print("Shutdown!")

    print(">>> Sleeping...")
    sleep(2)
    print(">>> Sleeping Done")


@worker_ready.connect
def worker_ready(sender, **kwargs):
    from scremsong.app.twitter import make_app_uuid, open_tweet_stream, get_latest_tweet_id
    logger.info(">>> worker_ready 1z")
    # task_id1 = task_fill_missing_tweets(get_latest_tweet_id()).delay()
    result = task_fill_missing_tweets.apply_async(args=[get_latest_tweet_id()], countdown=5)
    # print("task_id1", task_id1)
    print("result", result)
    logger.info(">>> worker_ready 2z")

    logger.info("Auto-starting tweet streaming in Celery worker {}".format(sender))
    task_id2 = task_open_tweet_stream.delay()
    print("task_id2", task_id2)
    print(">>> fooibar")

    return True


# @app.task(bind=True, base=AbortableTask)
@app.task(bind=True)
def task_open_tweet_stream(self):
    from scremsong.app.twitter import make_app_uuid, open_tweet_stream, get_latest_tweet_id
    open_tweet_stream()

    # while not self.is_aborted():
    #     sleep(1)

    logger.info("Done here!")
    return True


@app.task(bind=True)
def task_fill_missing_tweets(self, since_id):
    from scremsong.app.twitter import get_next_tweet_id, fill_in_missing_tweets

    if since_id is None:
        logger.info("There's no tweets in the database - skipping filling in missing tweets")
        return True

    # Wait until streaming starts to begin filling in the gaps otherwise
    # we won't know when to stop.
    max_id = None
    while max_id is None:
        max_id = get_next_tweet_id(since_id)

        if max_id is not None:
            # Get everything except max_id itself (because we already have it, duh)
            max_id = str(int(max_id) - 1)

            logger.info("Auto-starting filling in missing tweets since {} and until {} in Celery worker".format(since_id, max_id))
            tweets_added = fill_in_missing_tweets(since_id, max_id)
            logger.info("Filled in {} missing tweets".format(tweets_added))
        else:
            logger.info("Waiting for streaming to start until we can fill missing tweets...")
            sleep(2)

    logger.info("Done filling missing tweets!")
    return True
