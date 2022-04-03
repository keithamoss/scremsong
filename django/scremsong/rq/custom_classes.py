from scremsong.rq.rq_utils import (does_job_want_to_be_unique,
                                   get_duplicate_jobs,
                                   is_job_started_or_queued,
                                   report_job_failure, report_job_success)
from scremsong.util import make_logger

from rq.job import Job
from rq.queue import Queue
from rq.worker import Worker

logger = make_logger(__name__)


class ScremsongQueue(Queue):
    def __init__(self, *args, **kwargs):
        return super(ScremsongQueue, self).__init__(*args, **kwargs)

    def enqueue_call(self, *args, **kwargs):
        if kwargs["meta"] is not None and "_scremsong_job_name" in kwargs["meta"] and kwargs["meta"]["_scremsong_job_name"] is not None:
            scremsong_job_name = kwargs["meta"]["_scremsong_job_name"].format(**kwargs["kwargs"])
        elif type(args) == tuple and callable(args[0]) is True:
            scremsong_job_name = args[0].__name__
        else:
            raise Exception("No _scremsong_job_name could be determined from meta or args")

        meta_base = kwargs["meta"] if kwargs["meta"] is not None else {}
        kwargs["meta"] = {**meta_base, **{"_scremsong_job_name": scremsong_job_name}}

        if does_job_want_to_be_unique(kwargs["meta"]) is True:
            logger.info(f"Ensuring task {scremsong_job_name} is unique")
            if is_job_started_or_queued(scremsong_job_name) is True:
                logger.info(f"Skip enqueueing job '{scremsong_job_name}', another is already queued or started")
                return None

        return super(ScremsongQueue, self).enqueue_call(*args, **kwargs)

    def create_job(self, *args, **kwargs):
        kwargs["on_success"] = report_job_success
        kwargs["on_failure"] = report_job_failure
        return super(ScremsongQueue, self).create_job(*args, **kwargs)

    # def run_job(self, *args, **kwargs):
    #     return super(ScremsongQueue, self).run_job(*args, **kwargs)


class ScremsongWorker(Worker):
    def __init__(self, *args, **kwargs):
        return super(ScremsongWorker, self).__init__(*args, **kwargs)

    def perform_job(self, *args, **kwargs):
        job = args[0]

        does_job_want_to_be_unique_check = does_job_want_to_be_unique(job.meta)
        logger.debug(f"job {job.func_name} ({job.id}) does_job_want_to_be_unique = {does_job_want_to_be_unique_check}")

        duplicate_jobs = get_duplicate_jobs(job)
        logger.debug(f"job {job.func_name} ({job.id}) get_duplicate_jobs for {job.func_name} = {duplicate_jobs}")

        if does_job_want_to_be_unique_check is True and len(duplicate_jobs) > 0:
            logger.warning(f"Avoiding performing job {job.func_name} ({job.id}) in queue {job.origin} because it is already queued or started somewhere else")
            return

        return super(ScremsongWorker, self).perform_job(*args, **kwargs)


class ScremsongJob(Job):
    def __init__(self, *args, **kwargs):
        return super(ScremsongJob, self).__init__(*args, **kwargs)

    # def perform(self, *args, **kwargs):
    #     return super(ScremsongJob, self).perform(*args, **kwargs)
