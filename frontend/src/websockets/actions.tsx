import { Action } from "redux"
import { IRateLimitResources } from "../admin_panel/TwitterRateLimitStatus/TwitterRateLimitStatusContainer"
import { INotification } from "../redux/modules/app"
import { IReviewerAssignment, IReviewerUser } from "../redux/modules/reviewers"
import {
    eSocialTwitterRateLimitState,
    ISocialPrecannedTweetReplies,
    ISocialTweet,
    ISocialTweetList,
    ISocialTweetsAndColumnsResponse,
    ISocialTweetStateUpdate,
} from "../redux/modules/social"
import { ITriageColumn } from "../redux/modules/triage"
import { IUser } from "../redux/modules/user"
import {
    WS_CONNECTED,
    WS_NOTIFICATION,
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED,
    WS_REVIEWERS_ASSIGNMENT_UPDATED,
    WS_REVIEWERS_BULK_ASSIGN,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
    WS_REVIEWERS_USER_CONNECTED,
    WS_SOCIAL_COLUMNS_LIST,
    WS_SOCIAL_COLUMNS_UPDATE,
    WS_TWEETS_LOAD_TWEETS,
    WS_TWEETS_NEW_TWEETS,
    WS_TWEETS_PRECANNED_REPLIES,
    WS_TWEETS_RATE_LIMIT_RESOURCES,
    WS_TWEETS_RATE_LIMIT_STATE,
    WS_TWEETS_SET_STATE,
    WS_TWEETS_STREAMING_STATE,
    WS_TWEETS_UPDATE_TWEETS,
} from "./constants"

// Models
export interface IActionWebSocketBase {
    msg_type: string
}

export interface IActionConnected extends Action<typeof WS_CONNECTED> {
    is_logged_in: boolean
    user: IUser
    actions: Action[]
}

export interface IActionNotification extends Action<typeof WS_NOTIFICATION>, INotification {}

export interface IActionSocialColumnsList extends Action<typeof WS_SOCIAL_COLUMNS_LIST> {
    columns: ITriageColumn[]
}
export interface IActionSocialColumnsUpdate extends Action<typeof WS_SOCIAL_COLUMNS_UPDATE> {
    columns: ITriageColumn[]
}

export interface IActionReviewersList extends Action<typeof WS_REVIEWERS_LIST_USERS> {
    users: IReviewerUser[]
}

export interface IActionReviewersListAssignments extends Action<typeof WS_REVIEWERS_LIST_ASSIGNMENTS> {
    assignments: IReviewerAssignment[]
    tweets: ISocialTweetList
}

export interface IActionReviewersAssign extends Action<typeof WS_REVIEWERS_ASSIGN> {
    assignment: IReviewerAssignment
    tweets: ISocialTweetList
}

export interface IActionReviewersUnassign extends Action<typeof WS_REVIEWERS_UNASSIGN> {
    assignmentId: number
}

export interface IActionReviewersBulkAssign extends Action<typeof WS_REVIEWERS_BULK_ASSIGN> {
    assignments: IReviewerAssignment[]
    tweets: ISocialTweetList
}

export interface IActionReviewersAssignmentUpdated extends Action<typeof WS_REVIEWERS_ASSIGNMENT_UPDATED> {
    assignment: IReviewerAssignment
    tweets: ISocialTweetList
}

export interface IActionReviewersAssignmentMetadataChanged extends Action<typeof WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED> {
    assignment: IReviewerAssignment
}

export interface IActionReviewersSetStatus extends Action<typeof WS_REVIEWERS_SET_STATUS> {
    user_id: number
    is_accepting_assignments: boolean
}

export interface IActionReviewersUserConnected extends Action<typeof WS_REVIEWERS_USER_CONNECTED> {
    user: IReviewerUser
}

export interface ITweetFetchColumn {
    id: number
    tweet_ids: string[]
    tweet_ids_buffered: string[]
}

export interface IActionTweetsStreamingState extends Action<typeof WS_TWEETS_STREAMING_STATE> {
    connected: boolean
}

export interface IActionTweetsRateLimitState extends Action<typeof WS_TWEETS_RATE_LIMIT_STATE> {
    state: eSocialTwitterRateLimitState
}

export interface IActionTweetsRateLimitResources extends Action<typeof WS_TWEETS_RATE_LIMIT_RESOURCES> {
    resources: IRateLimitResources
}

export interface IActionTweetsNew extends Action<typeof WS_TWEETS_NEW_TWEETS> {
    tweets: ISocialTweet[]
    columnIds: {
        [key: string]: number[]
    }
}

export interface IActionTweetsUpdateTweets extends Action<typeof WS_TWEETS_UPDATE_TWEETS> {
    tweets: ISocialTweet[]
}

export interface IActionsTweetsSetState extends Action<typeof WS_TWEETS_SET_STATE> {
    tweetStates: ISocialTweetStateUpdate[]
}

export interface IActionsTweetsPrecannedReplies extends Action<typeof WS_TWEETS_PRECANNED_REPLIES> {
    replies: ISocialPrecannedTweetReplies
}

export interface IActionsTweetsLoadTweets extends Action<typeof WS_TWEETS_LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {}
