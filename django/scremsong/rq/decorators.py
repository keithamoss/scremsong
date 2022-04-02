from functools import wraps

from django.conf import settings
from django_rq import get_queue
from scremsong.rq.worker_utils import is_job_started_or_queued
from scremsong.util import make_logger

from rq.compat import string_types
from rq.defaults import DEFAULT_RESULT_TTL
from rq.queue import Queue
from rq.utils import backend_class

logger = make_logger(__name__)

# This was an experiment (now no longer needed, because we're doing it in the custom classes) at
# building a "only allow one of this task to exist at once" decorator.
# It's based on mushing together the RQ decorator with the Django-RQ decorator.


class job:
    queue_class = Queue

    def __init__(self, job_name=None, queue="default", connection=None, timeout=None,
                 result_ttl=DEFAULT_RESULT_TTL, ttl=None,
                 queue_class=None, depends_on=None, at_front=None, meta=None,
                 description=None, failure_ttl=None, retry=None, on_failure=None,
                 on_success=None):
        """
        The same as RQ's job decorator, but it allows us to enforce unique jobs
        so that the same job is not enqueued multiple times.
        Also ported improvements to connection handling and DEFAULT_RESULT_TTL
        from Django RQ's job decorator.
        """
        # BEGIN: Scremsong customisation to allow enforcing unqiue jobs
        self._scremsong_job_name_tmpl = job_name
        # END: Scremsong customisation to allow enforcing unqiue jobs

        # BEGIN: Ported from Django-RQ's @job decorator
        # https://github.com/rq/django-rq/blob/master/django_rq/decorators.py
        if isinstance(queue, str):
            try:
                queue = get_queue(queue)
                if connection is None:
                    connection = queue.connection
            except KeyError:
                pass

        RQ = getattr(settings, 'RQ', {})
        default_result_ttl = RQ.get('DEFAULT_RESULT_TTL')
        if default_result_ttl is not None:
            result_ttl = default_result_ttl
        # END: Ported from Django-RQ's @job decorator

        self.queue = queue
        self.queue_class = backend_class(self, 'queue_class', override=queue_class)
        self.connection = connection
        self.timeout = timeout
        self.result_ttl = result_ttl
        self.ttl = ttl
        self.meta = meta
        self.depends_on = depends_on
        self.at_front = at_front
        self.description = description
        self.failure_ttl = failure_ttl
        self.retry = retry
        self.on_success = on_success
        self.on_failure = on_failure

    def __call__(self, f):
        @wraps(f)
        def delay(*args, **kwargs):
            # BEGIN: Scremsong customisation to allow enforcing unqiue jobs
            if self._scremsong_job_name_tmpl is not None:
                scremsong_job_name = self._scremsong_job_name_tmpl.format(**kwargs)

                meta = {} if self.meta is None else self.meta
                self.meta = {**meta, **{"_scremsong_job_name": scremsong_job_name}}

                if is_job_started_or_queued(scremsong_job_name) is True:
                    logger.info(f"Job '{scremsong_job_name}' is already queued or started, skip enqueueing another")
                    return None
            # END: Scremsong customisation to allow enforcing unqiue jobs

            if isinstance(self.queue, string_types):
                queue = self.queue_class(name=self.queue,
                                         connection=self.connection)
            else:
                queue = self.queue

            depends_on = kwargs.pop('depends_on', None)
            job_id = kwargs.pop('job_id', None)
            at_front = kwargs.pop('at_front', False)

            if not depends_on:
                depends_on = self.depends_on

            if not at_front:
                at_front = self.at_front

            return queue.enqueue_call(f, args=args, kwargs=kwargs,
                                      timeout=self.timeout, result_ttl=self.result_ttl,
                                      ttl=self.ttl, depends_on=depends_on, job_id=job_id, at_front=at_front,
                                      meta=self.meta, description=self.description, failure_ttl=self.failure_ttl,
                                      retry=self.retry, on_failure=self.on_failure, on_success=self.on_success)
        f.delay = delay
        return f
