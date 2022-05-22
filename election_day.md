# Tasks to do just before election day:

- [ ] Resize the server (Federal 2022 was 1vCPU, 2GB RAM, 50GB SSD, 2TB Transfer and had no performance issues)
- [ ] Re-enable `task_collect_twitter_rate_limit_info()` in jobs.py
- [ ] Add any columns specific to the election (e.g. "#nswvotes sausage")
- [ ] Unassign all of the columns
- [ ] Disable any specific columns still running from the last election
- [ ] Close all existing assignments as not actioned `UPDATE scremsong.app_socialassignments SET state = 'Closed', close_reason = 'Not Actioned' WHERE state = 'Pending';`
- [ ] Close all old (>= 3 days) existing tweets as not actioned `UPDATE scremsong.app_tweets SET state = 'Not Actioned' WHERE state = 'Active' AND EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY')) / 86400 >= 3;`
- [ ] Archive all tweets from the last election `UPDATE scremsong.app_tweets SET status = 'TweetStatus.Archived' WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') < '2022-03-01 00:00:00+00';`
- [ ] Reset people's column position settings `UPDATE scremsong.app_profile SET settings = jsonb_set(settings, '{column_positions}', '{}', FALSE);`

# Queries to generate stats for election day:

```sql
SELECT COUNT(*) FROM scremsong.app_tweets WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') + interval '8 hour' >= '2022-05-21';

SELECT COUNT(*) FROM scremsong.app_tweets WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') + interval '8 hour' >= '2022-05-21' AND column_id IS NOT NULL;

SELECT COUNT(*) FROM scremsong.app_tweets WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') + interval '8 hour' >= '2022-05-21' AND LOWER(data->>'text') LIKE 'rt @demsausage%';

SELECT COUNT(*) FROM scremsong.app_tweets WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') + interval '8 hour' >= '2022-05-21' AND LOWER(data->>'text') LIKE '%@demsausage%';


SELECT
	COUNT(*),
	state
FROM scremsong.app_tweets
WHERE to_timestamp(data->>'created_at', 'Dy Mon DD HH24:MI:SS +0000 YYYY') + interval '8 hour' >= '2022-05-21' AND column_id IS NOT NULL
GROUP BY state;
```

## Report template

Total tweets received:
Total tweets that went to triage:

Mentions of @DemSausage:
Retweets of @DemSausage:

Tweets reviewed by vollies:
Tweets actioned and still awaiting a response:
Tweets ignored / dismissed by triagers:
Tweets that went untriaged:

The tables on https://scremsong.democracysausage.org have stats for each person for the day and for each column.

I think xx narrowly 'won' the day, with xx a close second?

# Tasks to do after election day:

- [ ] Disable `task_collect_twitter_rate_limit_info()` in jobs.py (or not, if we're turning the server off)
- [ ] Remove volunteer access from Scremsong `UPDATE scremsong.auth_user SET is_active = False WHERE is_staff = False;`
- [ ] Copy all of the logs off of the server for later analysis for errors et cetera
- [ ] Bookmark significant/interesting Sentry logs for later and analysis fixing
- [ ] Log a ticket to examine the RQ task results for anything interesting
- [ ] Snapshot the server and destroy it
- [ ] Analyse Scremsong rate limit data to see what we got close to hitting
