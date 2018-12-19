import { Action } from "redux"
import { INotificationOptions } from "../redux/modules/app"
import { eSocialAssignmentStatus, IReviewerAssignment, IReviewerUser } from "../redux/modules/reviewers"
import { ISocialTweet, ISocialTweetList, ISocialTweetsAndColumnsResponse } from "../redux/modules/social"
import { ITriageColumn } from "../redux/modules/triage"
import { IUser } from "../redux/modules/user"
import {
    WS_CONNECTED,
    WS_NOTIFICATION,
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
    WS_SOCIAL_COLUMNS_LIST,
    WS_TWEETS_DISMISS,
    WS_TWEETS_LOAD_TWEETS,
    WS_TWEETS_NEW_TWEET,
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

export interface IActionTweetsNew extends Action<typeof WS_TWEETS_NEW_TWEET> {
    tweet: ISocialTweet
    columnIds: number[]
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
}

export interface IActionReviewersUnassign extends Action<typeof WS_REVIEWERS_UNASSIGN> {
    assignmentId: number
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
}

export interface IActionsTweetsDismiss extends Action<typeof WS_TWEETS_DISMISS> {
    tweetId: string
}

export interface IActionsTweetsLoadTweets extends Action<typeof WS_TWEETS_LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {}
