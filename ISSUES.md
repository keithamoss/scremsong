# User interface

Closing an assignment shows two "Assignment closed" notifications

So too does a user coming online

TweetColumn.tsx assumes that all of that assignments in tweet_assignments are pending...at least for showing the action buttons. But they're not, once the user has done some actions related to assignments it will contain a mix of pending, closed, et cetera
