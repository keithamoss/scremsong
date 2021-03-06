export const WS_URI = process.env.REACT_APP_WEB_SOCKET_URI!

export const WS_CONNECTED = 'ws/scremsong/CONNECTED'
export const WS_NOTIFICATION = 'ws/scremsong/NOTIFICATION'

export const WS_TWEETS_STREAMING_STATE = 'ws/scremsong/tweets/STREAMING_STATE'
export const WS_TWEETS_RATE_LIMIT_STATE = 'ws/scremsong/tweets/RATE_LIMIT_STATE'
export const WS_TWEETS_RATE_LIMIT_RESOURCES = 'ws/scremsong/tweets/RATE_LIMIT_RESOURCES'
export const WS_TWEETS_NEW_TWEETS = 'ws/scremsong/tweets/NEW_TWEETS'
export const WS_TWEETS_LOAD_TWEETS = 'ws/scremsong/tweets/LOAD_TWEETS'
export const WS_TWEETS_UPDATE_TWEETS = 'ws/scremsong/tweets/UPDATE_TWEETS'
export const WS_TWEETS_SET_STATE = 'ws/scremsong/tweets/SET_STATE'
export const WS_TWEETS_PRECANNED_REPLIES = 'ws/scremsong/tweets/PRECANNED_REPLIES'

export const WS_SOCIAL_COLUMNS_LIST = 'ws/scremsong/social_columns/LIST'
export const WS_SOCIAL_COLUMNS_UPDATE = 'ws/scremsong/social_columns/UPDATE'

export const WS_REVIEWERS_USER_CONNECTED = 'ws/scremsong/reviewers/USER_CONNECTED'
export const WS_REVIEWERS_LIST_USERS = 'ws/scremsong/reviewers/LIST_USERS'
export const WS_REVIEWERS_LIST_ASSIGNMENTS = 'ws/scremsong/reviewers/LIST_ASSIGNMENTS'
export const WS_REVIEWERS_ASSIGN = 'ws/scremsong/reviewers/ASSIGN'
export const WS_REVIEWERS_UNASSIGN = 'ws/scremsong/reviewers/UNASSIGN'
export const WS_REVIEWERS_BULK_ASSIGN = 'ws/scremsong/reviewers/BULK_ASSIGN'
export const WS_REVIEWERS_ASSIGNMENT_UPDATED = 'ws/scremsong/reviewers/ASSIGNMENT_UPDATED'
export const WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED = 'ws/scremsong/reviewers/ASSIGNMENT_METADATA_CHANGED'
export const WS_REVIEWERS_SET_STATUS = 'ws/scremsong/reviewers/SET_STATUS'

export const WS_SOCIALPLATFORMS_SETTINGS = 'ws/scremsong/socialplatforms/SETTINGS'

export const messageTypes = [
  WS_NOTIFICATION,
  WS_TWEETS_STREAMING_STATE,
  WS_TWEETS_RATE_LIMIT_STATE,
  WS_TWEETS_RATE_LIMIT_RESOURCES,
  WS_TWEETS_NEW_TWEETS,
  WS_TWEETS_LOAD_TWEETS,
  WS_TWEETS_UPDATE_TWEETS,
  WS_TWEETS_SET_STATE,
  WS_TWEETS_PRECANNED_REPLIES,
  WS_SOCIAL_COLUMNS_LIST,
  WS_SOCIAL_COLUMNS_UPDATE,
  WS_REVIEWERS_USER_CONNECTED,
  WS_REVIEWERS_LIST_USERS,
  WS_REVIEWERS_LIST_ASSIGNMENTS,
  WS_REVIEWERS_ASSIGN,
  WS_REVIEWERS_UNASSIGN,
  WS_REVIEWERS_BULK_ASSIGN,
  WS_REVIEWERS_ASSIGNMENT_UPDATED,
  WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED,
  WS_REVIEWERS_SET_STATUS,
  WS_SOCIALPLATFORMS_SETTINGS,
]
