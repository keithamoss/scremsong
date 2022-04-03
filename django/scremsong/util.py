import logging
import os
import time


class TopMostCallerScremsong(logging.Filter):
    def filter(self, record):
        # https://stackoverflow.com/a/26682142
        import traceback
        record.stack = ""

        for row in traceback.extract_stack():
            # Find the top most caller
            if "/app/scremsong" in row.filename and "custom_classes.py" not in row.filename:
                record.stack = f"{row.filename} {row.name}"
                break
        return True


def make_logger(name):
    logger = logging.getLogger(name)
    logger.addFilter(TopMostCallerScremsong())

    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    # fmt = logging.Formatter("%(asctime)s [%(levelname)s] [P:%(process)d] [%(threadName)s] [%(stack)s] %(message)s (%(pathname)s %(funcName)s() line=%(lineno)d)")
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] [P:%(process)d] %(message)s (%(pathname)s %(funcName)s() line=%(lineno)d) (%(stack)s)")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    return logger


def deepupdate(original, update):
    """
    Recursively update a dict.
    Subdict's won't be overwritten but also updated.
    http://stackoverflow.com/a/8310229/7368493
    """
    for key, value in original.items():
        if key not in update:
            update[key] = value
        elif isinstance(value, dict):
            deepupdate(value, update[key])
    return update


def get_env(k, d=None):
    if k not in os.environ:
        return d
    v = os.environ[k]
    return v


def timeit(method):
    def timed(*args, **kw):
        ts = time.time()
        result = method(*args, **kw)
        te = time.time()
        if 'log_time' in kw:
            name = kw.get('log_name', method.__name__.upper())
            kw['log_time'][name] = int((te - ts) * 1000)
        else:
            print('%r  %2.2f ms' %
                  (method.__name__, (te - ts) * 1000))
        return result
    return timed


def get_or_none(classmodel, **kwargs):
    try:
        return classmodel.objects.get(**kwargs)
    except classmodel.DoesNotExist:
        return None
