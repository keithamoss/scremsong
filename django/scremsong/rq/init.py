from scremsong.rq.jobs import task_restart_tweet_streaming
from scremsong.util import make_logger

logger = make_logger(__name__)

logger.info("Starting tweet streaming tasks from init.py")
task_restart_tweet_streaming.delay()
