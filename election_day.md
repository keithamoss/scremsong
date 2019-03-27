Tasks to do just before election day:

-   [ ] Re-enable `task_collect_twitter_rate_limit_info()` in celery.py
-   [ ] Add any columns specific to the election (e.g. "#nswvotes sausage")
-   [ ] Disable any specific columns still running from the last election
-   [ ] Close all existing assignments as not actioned `UPDATE scremsong.app_socialassignments SET state = 'Closed', close_reason = 'Not Actioned' WHERE state = 'Pending';`
