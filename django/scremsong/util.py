import json
import logging
import os
import sys
import time
import traceback


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


def is_jsonable(obj):
    try:
        json.dumps(obj)
        return True
    except:
        return False


def is_iterable(obj):
    # https://stackoverflow.com/a/1952655

    try:
        iterator = iter(obj)
    except TypeError:
        # not iterable
        return False
    else:
        # iterable
        return True


def get_stracktrace_string_for_current_exception():
    # https://stackoverflow.com/a/49613561

    # Get current system exception
    ex_type, ex_value, ex_traceback = sys.exc_info()

    # Extract unformatter stack traces as tuples
    trace_back = traceback.extract_tb(ex_traceback)

    # Format stacktrace
    stack_trace = list()

    for trace in trace_back:
        stack_trace.append("File \"%s\", line : %d, in \"%s\", message: %s" % (trace[0], trace[1], trace[2], trace[3]))

    return "\r\n".join(stack_trace)
