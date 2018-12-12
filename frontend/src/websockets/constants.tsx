export const WS_URI = process.env.REACT_APP_WEB_SOCKET_URI!

export const WS_CONNECTED = "ws/scremsong/CONNECTED"

export const WS_SOCIAL_COLUMNS_LIST = "ws/scremsong/social_columns/LIST"

export const WS_REVIEWERS_LIST = "ws/scremsong/reviewers/LIST"
export const WS_REVIEWERS_SET_STATUS = "ws/scremsong/reviewers/SET_STATUS"

export const WS_ASSIGNMENTS_FOR_USER = "ws/scremsong/assignments/FOR_USER"

export const WS_TWEETS_FETCH_SOME = "ws/scremsong/tweets/FETCH_SOME"

export const messageTypes = [
    WS_SOCIAL_COLUMNS_LIST,
    WS_REVIEWERS_LIST,
    WS_REVIEWERS_SET_STATUS,
    WS_ASSIGNMENTS_FOR_USER,
    WS_TWEETS_FETCH_SOME,
]
