Tasks to do just before election day:

-   [ ] Re-enable `task_collect_twitter_rate_limit_info()` in celery.py
-   [ ] Add any columns specific to the election (e.g. "#nswvotes sausage")
-   [ ] Disable any specific columns still running from the last election
-   [ ] Close all existing assignments as not actioned `UPDATE scremsong.app_socialassignments SET state = 'Closed', close_reason = 'Not Actioned' WHERE state = 'Pending';`
-   [ ] Close all old (>= 3 days) existing tweets as not actioned `UPDATE scremsong.app_tweets SET state = 'Not Actioned' WHERE state = 'Active' AND EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY')) / 86400 >= 3;`

Tasks to do after election day:

-   [ ] Put together the stats report for the day (below)

> Scremsong pulled in 8,739 tweets and replies to tweets. Our triagers processed 2,110 tweets, assigning 686 tweet threads (H 412, K 135, D 130, A 6, and D 3) from which we sent 222 replies. Ki dealt with the most assignments (169), closed followed by K (157), C (145), D (45), D (16), H (10), N (10), and A (5).
