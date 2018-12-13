import * as dotProp from "dot-prop-immutable"
import { memoize } from "lodash-es"
import { values as objectValues } from "lodash-es/"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"
import { Action } from "redux"
import { createSelector } from "reselect"
import { IActionReviewersList, IActionReviewersListAssignments, IActionReviewersSetStatus } from "src/websockets/actions"
import { WS_REVIEWERS_LIST_ASSIGNMENTS, WS_REVIEWERS_LIST_USERS, WS_REVIEWERS_SET_STATUS } from "src/websockets/constants"
import { IStore, IThunkExtras } from "../../redux/modules/interfaces"
import { eSocialPlatformChoice } from "./triage"
import { IUser } from "./user"

// Actions
const ASSIGN_REVIEWER = "ealgis/app/ASSIGN_REVIEWER"
const UNASSIGN_REVIEWER = "ealgis/app/UNASSIGN_REVIEWER"
const MARK_ASSIGNMENT_DONE = "ealgis/app/MARK_ASSIGNMENT_DONE"
const SET_CURRENT_REVIEWER = "ealgis/app/SET_CURRENT_REVIEWER"

const initialState: IModule = {
    users: [],
    currentReviewerId: null,
    assignments: [],
}

// Reducer
type IAction =
    | IActionReviewersList
    | IActionReviewersListAssignments
    | IActionReviewersSetStatus
    | IActionReviewersAssignReviewer
    | IActionReviewersUnassignReviewer
    | IActionReviewersMarkAssignmentDone
    | IActionReviewersSetCurrentReviewer
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case WS_REVIEWERS_LIST_USERS:
            return dotProp.set(state, "users", action.users)
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            return dotProp.set(state, "assignments", action.assignments)
        case SET_CURRENT_REVIEWER:
            return dotProp.set(state, "currentReviewerId", action.reviewerId)
        case ASSIGN_REVIEWER:
            state = dotProp.set(state, `tweets.${action.tweetId}.reviewer_id`, action.reviewerId)
            return dotProp.set(state, `tweets.${action.tweetId}.review_status`, "SocialAssignmentStatus.PENDING")
        case UNASSIGN_REVIEWER:
            state = dotProp.delete(state, `tweets.${action.tweetId}.reviewer_id`)
            return dotProp.delete(state, `tweets.${action.tweetId}.review_status`)
        case MARK_ASSIGNMENT_DONE:
            // return dotProp.set(state, `assignments.${assignmentIndex}.status`, "SocialAssignmentStatus.DONE")
            return dotProp.delete(state, `assignments.${action.assignmentId}`)
        case WS_REVIEWERS_SET_STATUS:
            return dotProp.set(state, `users.${action.user_id}.is_accepting_assignments`, action.is_accepting_assignments)
        default:
            return state
    }
}

// Selectors

const getAssignments = (state: IStore) => objectValues(state.reviewers.assignments)
const getCurrentReviewerUserId = (state: IStore) => (state.reviewers.currentReviewerId ? state.reviewers.currentReviewerId : null)
const getReviewers = (state: IStore) => state.reviewers.users

export const getUserAssignments = createSelector(
    [getAssignments],
    assignments =>
        memoize((userId: number | undefined) => {
            return userId === undefined ? [] : assignments.filter((assignment: IReviewerAssignment) => assignment.user_id === userId)
        })
)

export const getCurrentReviewerAssignments = createSelector(
    [getAssignments, getCurrentReviewerUserId],
    (assignments: IReviewerAssignment[], userId: number | null) => {
        return userId === null ? [] : assignments.filter((assignment: IReviewerAssignment) => assignment.user_id === userId)
    }
)

export const getCurrentReviewer = createSelector(
    [getReviewers, getCurrentReviewerUserId],
    (users: IReviewerUser[], userId: number | null) => {
        return userId === null ? null : users.find((reviewer: IReviewerUser) => reviewer.id === userId)
    }
)

// Action Creators

export const assignReviewer = (tweetId: string, reviewerId: number): IActionReviewersAssignReviewer => ({
    type: ASSIGN_REVIEWER,
    tweetId,
    reviewerId,
})

export const unassignReviewer = (tweetId: string): IActionReviewersUnassignReviewer => ({
    type: UNASSIGN_REVIEWER,
    tweetId,
})

export const markAnAssignmentDone = (assignmentId: number): IActionReviewersMarkAssignmentDone => ({
    type: MARK_ASSIGNMENT_DONE,
    assignmentId,
})

export const setCurrentReviewer = (reviewerId: number): IActionReviewersSetCurrentReviewer => ({
    type: SET_CURRENT_REVIEWER,
    reviewerId,
})

// Models
export interface IModule {
    users: IReviewerUser[]
    currentReviewerId: number | null
    assignments: IReviewerAssignment[]
}

export enum eSocialAssignmentStatus {
    PENDING = "SocialAssignmentStatus.PENDING",
    PROCESSED = "SocialAssignmentStatus.PROCESSED",
    DONE = "SocialAssignmentStatus.DONE",
}

export interface IReviewerUser {
    id: number
    initials: string
    is_accepting_assignments: boolean
    name: string
    username: string
}

export interface IReviewerAssignment {
    id: number
    platform: eSocialPlatformChoice
    social_id: string
    status: eSocialAssignmentStatus
    user_id: number
}

export interface IActionReviewersAssignReviewer extends Action<typeof ASSIGN_REVIEWER> {
    tweetId: string
    reviewerId: number
}

export interface IActionReviewersUnassignReviewer extends Action<typeof UNASSIGN_REVIEWER> {
    tweetId: string
}

export interface IActionReviewersMarkAssignmentDone extends Action<typeof MARK_ASSIGNMENT_DONE> {
    assignmentId: number
}

export interface IActionReviewersSetCurrentReviewer extends Action<typeof SET_CURRENT_REVIEWER> {
    reviewerId: number
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera

export function changeCurrentReviewer(user: IUser) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        if (user !== null) {
            dispatch(setCurrentReviewer(user.id))
        }
    }
}

export function assignAReviewer(tweetId: string, reviewerId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(assignReviewer(tweetId, reviewerId))
        await api.get("/api/0.1/social_assignments/assign_reviewer/", dispatch, {
            tweetId,
            reviewerId,
        })
    }
}

export function unassignAReviewer(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(unassignReviewer(tweetId))
        await api.get("/api/0.1/social_assignments/unassign_reviewer/", dispatch, {
            tweetId,
        })
    }
}

export function markAssignmentDone(assignment: IReviewerAssignment) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(markAnAssignmentDone(assignment.id))
        await api.get("/api/0.1/social_assignments/assignment_done/", dispatch, {
            assignmentId: assignment.id,
        })
    }
}

export function onToggleCurrentReviewerOnlineStatus(isAcceptingAssignments: boolean) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        const currentReviewerId = getState().reviewers.currentReviewerId
        await api.get("/api/0.1/social_assignments/set_user_accepting_assignments/", dispatch, {
            user_id: currentReviewerId,
            is_accepting_assignments: isAcceptingAssignments,
        })
    }
}
