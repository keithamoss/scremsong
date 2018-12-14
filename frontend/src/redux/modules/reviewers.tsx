import * as dotProp from "dot-prop-immutable"
import { memoize } from "lodash-es"
import { values as objectValues } from "lodash-es/"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"
import { Action } from "redux"
import { createSelector } from "reselect"
import {
    IActionReviewersAssign,
    IActionReviewersAssignmentStatusChange,
    IActionReviewersList,
    IActionReviewersListAssignments,
    IActionReviewersSetStatus,
    IActionReviewersUnassign,
} from "src/websockets/actions"
import {
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
} from "src/websockets/constants"
import { IStore, IThunkExtras } from "../../redux/modules/interfaces"
import { eSocialPlatformChoice } from "./triage"
import { IUser } from "./user"

// Actions
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
    | IActionReviewersAssign
    | IActionReviewersUnassign
    | IActionReviewersAssignmentStatusChange
    | IActionReviewersSetCurrentReviewer
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case WS_REVIEWERS_LIST_USERS:
            return dotProp.set(state, "users", action.users)
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            return dotProp.set(state, "assignments", action.assignments)
        case SET_CURRENT_REVIEWER:
            return dotProp.set(state, "currentReviewerId", action.reviewerId)
        case WS_REVIEWERS_ASSIGN:
            return dotProp.set(state, `assignments.${action.assignment.id}`, action.assignment)
        case WS_REVIEWERS_UNASSIGN:
            return dotProp.delete(state, `assignments.${action.assignmentId}`)
        case WS_REVIEWERS_ASSIGNMENT_STATUS_CHANGE:
            return dotProp.set(state, `assignments.${action.assignmentId}.status`, action.status)
        case WS_REVIEWERS_SET_STATUS:
            const userIndex = state.users.findIndex((user: IReviewerUser) => user.id === action.user_id)
            return dotProp.set(state, `users.${userIndex}.is_accepting_assignments`, action.is_accepting_assignments)
        default:
            return state
    }
}

// Selectors

const getPendingAssignments = (state: IStore) =>
    objectValues(state.reviewers.assignments).filter(
        (assignment: IReviewerAssignment, index: number) => assignment.status === eSocialAssignmentStatus.PENDING
    )
const getCurrentReviewerUserId = (state: IStore) => (state.reviewers.currentReviewerId ? state.reviewers.currentReviewerId : null)
const getReviewers = (state: IStore) => state.reviewers.users

export const getUserAssignments = createSelector(
    [getPendingAssignments],
    assignments =>
        memoize((userId: number | undefined) => {
            return userId === undefined ? [] : assignments.filter((assignment: IReviewerAssignment) => assignment.user_id === userId)
        })
)

export const getCurrentReviewerAssignments = createSelector(
    [getPendingAssignments, getCurrentReviewerUserId],
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

export function assignReviewer(tweetId: string, reviewerId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/social_assignments/assign_reviewer/", dispatch, {
            tweetId,
            reviewerId,
        })
    }
}

export function unassignReviewer(assignmentId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/social_assignments/unassign_reviewer/", dispatch, {
            assignmentId,
        })
    }
}

export function markAssignmentDone(assignment: IReviewerAssignment) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/social_assignments/assignment_done/", dispatch, {
            assignmentId: assignment.id,
        })
    }
}

export function toggleReviewerOnlineStatus(isAcceptingAssignments: boolean, userId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/social_assignments/set_user_accepting_assignments/", dispatch, {
            user_id: userId,
            is_accepting_assignments: isAcceptingAssignments,
        })
    }
}
