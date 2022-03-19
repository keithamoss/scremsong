# Celery: We can't kill tasks to restart streaming (March 2021)

There's an issue at the moment (or maybe it was always there?) that means our shutdown_celery_worker() use of .broadcast("shutdown") doesn't work with gevent

https://github.com/celery/celery/issues/4019
https://github.com/celery/celery/issues/5209

Celery Execution Pools: What is it all about?
https://www.distributedpython.com/2018/10/26/celery-execution-pool/

Maybe it could be a Kombu thing? That came up a lot in older discussions about this issue.

WORKAROUND: Went back to the old method of killing and restarting tasks (rather than trying to kill the whole worker)

# Celery: Duplicate tasks with the same taskIds and args are being created/run (March 2021)

This is a tricky one! Not sure what's causing it.

This old forum thread has a good examination of the same issue: https://groups.google.com/g/celery-users/c/W0Qf09ahjas?pli=1 (In their case it was Flower restoring unacked tasks)

WORKAROUND: is_a_matching_fill_missing_tweets_task_already_running() now kills all duplicate tasks and we've added a button to manually trigger task_fill_missing_tweets()

# Django, Celery, and sync to async (March 2021)

Django 3 is partway through migrating to use Python 3's new async functionality. Unfortunately for us, the ORM is hasn't been migrated yet - so we're sometimes seeing these 'sync to async' errors being thrown when Celery tasks call the ORM.

We tried to opt out of seeing warnings by setting DJANGO_ALLOW_ASYNC_UNSAFE=true per https://docs.djangoproject.com/en/3.1/topics/async/#envvar-DJANGO_ALLOW_ASYNC_UNSAFE, but that didn't work and we still kept seeing the errors.

`You cannot use AsyncToSync in the same thread as an async event loop - just await the async function directly.`

c.f. see the comments here: https://stackoverflow.com/a/43325237/7368493

WORKAROUND: Rollback to the latest in the Django 2.x series
