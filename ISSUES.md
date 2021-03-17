# Celery: We can't kill tasks to restart streaming (March 2021)

There's an issue at the moment (or maybe it was always there?) that means our shutdown_celery_worker() use of .broadcast("shutdown") doesn't work with gevent

https://github.com/celery/celery/issues/4019
https://github.com/celery/celery/issues/5209

Celery Execution Pools: What is it all about?
https://www.distributedpython.com/2018/10/26/celery-execution-pool/

# Tweepy: Connection broken: IncompleteRead (March 2021)

Fixed in https://github.com/tweepy/tweepy/commit/68e19cc6b9b23d72369ca1520093770eb18a5a9f and slated for the 4.0 release.

Relevant issues:
https://github.com/tweepy/tweepy/issues/448
https://github.com/tweepy/tweepy/issues/237

# Django, Celery, and sync to async (March 2021)

Django 3 is partway through migrating to use Python 3's new async functionality. Unfortunately for us, the ORM is hasn't been migrated yet - so we're sometimes seeing these 'sync to async' errors being thrown when Celery tasks call the ORM.

We tried to opt out of seeing warnings by setting DJANGO_ALLOW_ASYNC_UNSAFE=true per https://docs.djangoproject.com/en/3.1/topics/async/#envvar-DJANGO_ALLOW_ASYNC_UNSAFE, but that didn't work and we still kept seeing the errors.

`You cannot use AsyncToSync in the same thread as an async event loop - just await the async function directly.`

c.f. see the comments here: https://stackoverflow.com/a/43325237/7368493
