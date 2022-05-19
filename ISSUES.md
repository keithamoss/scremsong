# User interface

## Assumptions about assignments

TweetColumn.tsx assumes that all of that assignments in tweet_assignments are pending...at least for showing the action buttons. But they're not, once the user has done some actions related to assignments it will contain a mix of pending, closed, et cetera

## Inconsistent triage bar colour indicator for closed tweets

When an assignment has state=Closed, it shows a grey bar on any of its tweets...until the user refreshes. Then, because we don't load closed assignments, it shows a green bar.

See `TweetColumn.tsx` for more in-depth doco.
