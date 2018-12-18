export const WS_URI = process.env.REACT_APP_WEB_SOCKET_URI!

export const WS_CONNECTED = "ws/scremsong/CONNECTED"
export const WS_NOTIFICATION = "ws/scremsong/NOTIFICATION"

export const WS_TWEETS_NEW = "ws/scremsong/tweets/NEW"

export const WS_SOCIAL_COLUMNS_LIST = "ws/scremsong/social_columns/LIST"

export const WS_REVIEWERS_LIST_USERS = "ws/scremsong/reviewers/LIST_USERS"
export const WS_REVIEWERS_LIST_ASSIGNMENTS = "ws/scremsong/reviewers/LIST_ASSIGNMENTS"
export const WS_REVIEWERS_ASSIGN = "ws/scremsong/reviewers/ASSIGN"
export const WS_REVIEWERS_UNASSIGN = "ws/scremsong/reviewers/UNASSIGN"
export const WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE = "ws/scremsong/reviewers/ASSIGNMENT_STATUS_CHANGE"
export const WS_REVIEWERS_SET_STATUS = "ws/scremsong/reviewers/SET_STATUS"

export const WS_TWEETS_DISMISS = "ws/scremsong/tweets/DISMISS"
export const WS_TWEETS_FETCH_SOME = "ws/scremsong/tweets/FETCH_SOME"
export const WS_TWEETS_FETCH_SOME_NEW_TWEETS = "ws/scremsong/tweets/FETCH_SOME_NEW_TWEETS"

export const messageTypes = [
    WS_NOTIFICATION,
    WS_TWEETS_NEW,
    WS_SOCIAL_COLUMNS_LIST,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_UNASSIGN,
    WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
    WS_REVIEWERS_SET_STATUS,
    WS_TWEETS_DISMISS,
    WS_TWEETS_FETCH_SOME,
    WS_TWEETS_FETCH_SOME_NEW_TWEETS,
]
