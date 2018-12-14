import { Action } from "redux"
import { eSocialAssignmentStatus, IReviewerAssignment, IReviewerUser } from "src/redux/modules/reviewers"
import { ISocialTweetList } from "src/redux/modules/social"
import { ITriageColumn } from "src/redux/modules/triage"
import { IUser } from "src/redux/modules/user"
import {
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
    WS_SOCIAL_COLUMNS_LIST,
    WS_TWEETS_FETCH_SOME,
} from "./constants"

// Models
export interface IActionWebSocketBase {
    msg_type: string
}

export interface IActionConnected extends IActionWebSocketBase {
    is_logged_in: boolean
    user: IUser
    actions: Action[]
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

export interface IActionsTweetsFetch extends Action<typeof WS_TWEETS_FETCH_SOME> {
    columns: ITweetFetchColumn[]
    tweets: ISocialTweetList
}
