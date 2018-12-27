import { Action } from "redux"
import { INotificationOptions } from "../redux/modules/app"
import { eSocialAssignmentStatus, IReviewerAssignment, IReviewerUser } from "../redux/modules/reviewers"
import { eSocialTweetState, ISocialTweet, ISocialTweetList, ISocialTweetsAndColumnsResponse } from "../redux/modules/social"
import { ITriageColumn } from "../redux/modules/triage"
import { IUser } from "../redux/modules/user"
import {
    WS_CONNECTED,
    WS_NOTIFICATION,
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
    WS_REVIEWERS_ASSIGNMENT_UPDATED,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
    WS_SOCIAL_COLUMNS_LIST,
    WS_TWEETS_LOAD_TWEETS,
    WS_TWEETS_NEW_TWEETS,
    WS_TWEETS_SET_STATE,
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

export interface IActionNotification extends Action<typeof WS_NOTIFICATION> {
    message: string
    options: INotificationOptions
    key: string
}

export interface IActionTweetsNew extends Action<typeof WS_TWEETS_NEW_TWEETS> {
    tweets: ISocialTweet[]
    columnIds: {
        [key: string]: number[]
    }
}

export interface IActionSocialColumnsList extends Action<typeof WS_SOCIAL_COLUMNS_LIST> {
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

export interface IActionReviewersAssignmentUpdated extends Action<typeof WS_REVIEWERS_ASSIGNMENT_UPDATED> {
    assignment: IReviewerAssignment
    tweets: ISocialTweetList
}

export interface IActionReviewersAssignmentStatusChange extends Action<typeof WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE> {
    assignmentId: number
    status: eSocialAssignmentStatus
}

export interface IActionReviewersSetStatus extends Action<typeof WS_REVIEWERS_SET_STATUS> {
    user_id: number
    is_accepting_assignments: boolean
}

export interface ITweetFetchColumn {
    id: number
    tweet_ids: string[]
    tweet_ids_buffered: string[]
}

export interface IActionsTweetsSetState extends Action<typeof WS_TWEETS_SET_STATE> {
    tweetId: string
    tweetState: eSocialTweetState
}

export interface IActionsTweetsLoadTweets extends Action<typeof WS_TWEETS_LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {}
