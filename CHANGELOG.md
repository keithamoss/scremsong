# v1.1 (12-05-2019)

Enhancements and bug fixes for the 2019 Federal Election.

## Overall

-   [Enhancement] Scremsong will load a bit faster now.

## Triage

-   [Enhancement] Tweets will now only ever appear in one column (determined by a priority assigned to each column)
-   [Enhancement] Added a button to automatically assign a tweet to the reviewer who has the smallest queue
-   [Enhancement] A reviewer's current number of assignments now only includes their active assignments (not active + awaiting reply).
-   [Enhancement] The "Ignore" and "Dealt With" buttons now only display if the tweet isn't already assigned.
-   [Change] If a user is offline and one of their closed assignments receives a reply the assignment will be set back to pending so that others can clear it from their queue.
-   [Bug Fix] Fixed the mysterious bug where everyone ended up showing as offline
-   [Bug Fix] Links in tweets (e.g. to Facebook, Instagram) now open in a new tab.
-   [Bug Fix] Tweets with Videos/GIFs will now be displayed properly.
-   [Bug Fix] The issue with scrolling and seeing weird rendering issues on user mentions and hashtags is gone.
-   [Bug Fix] Sometimes really old tweets would appear in triage columns. This won't happen any more.

## Queue

-   [Enhancement] Simplified the workflow by removing the separate "Await Reply", "Close", and "Done" buttons. You now just need to "Close" an assignment and choose a reason (Awaiting Reply, Map Updated, No Change Required, Not Relevant).
-   [Enhancement] Your current number of assignments now only includes active assignments (not active + awaiting replies).
-   [Bug Fix] When you've cleared your queue the tab title will no longer show that you have one assignment left.
-   [Bug Fix] The "View on Twitter" button now links to the tweet you see on the assignment, not the original tweet that was assigned.
-   [Bug Fix] Replies from @DemSausage no longer cause assignments to reopen.
-   [Bug Fix] New and updated assignments now appear at the bottom of your queue so they don't interrupt what you're doing by causing the page to scroll a bit.
-   [Bug Fix] The "Undo" notifications now close the assignment straightaway, not when they disappear from the screen.

## Dashboard

-   [Enhancement] Triage now shows stats for all triage outcomes (not triaged, assigned, dealt with, et cetera)

# v1.0 (22-03-2019)

The first version of Scremsong goes live for the 2019 NSW Election
