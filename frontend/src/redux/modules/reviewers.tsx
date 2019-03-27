import * as dotProp from "dot-prop-immutable"
import { memoize, sortBy } from "lodash-es"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"
import { Action } from "redux"
import { createSelector } from "reselect"
import {
    IActionReviewersAssign,
    IActionReviewersAssignmentMetadataChanged,
    IActionReviewersAssignmentUpdated,
    IActionReviewersBulkAssign,
    IActionReviewersList,
    IActionReviewersListAssignments,
    IActionReviewersSetStatus,
    IActionReviewersUnassign,
    IActionReviewersUserConnected,
} from "../../websockets/actions"
import {
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED,
    WS_REVIEWERS_ASSIGNMENT_UPDATED,
    WS_REVIEWERS_BULK_ASSIGN,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_LIST_USERS,
    WS_REVIEWERS_SET_STATUS,
    WS_REVIEWERS_UNASSIGN,
    WS_REVIEWERS_USER_CONNECTED,
} from "../../websockets/constants"
import { IThunkExtras } from "./interfaces"
import { IStore } from "./reducer"
import { eSocialPlatformChoice } from "./triage"
import { eQueueSortBy, IProfileSettings } from "./user"

// Actions
const SET_CURRENT_REVIEWER = "scremsong/reviewers/SET_CURRENT_REVIEWER"

const initialState: IModule = {
    users: [],
    currentReviewerId: null,
    assignments: [],
}

// Reducer
type IAction =
    | IActionReviewersUserConnected
    | IActionReviewersList
    | IActionReviewersListAssignments
    | IActionReviewersSetStatus
    | IActionReviewersAssign
    | IActionReviewersUnassign
    | IActionReviewersBulkAssign
    | IActionReviewersAssignmentUpdated
    | IActionReviewersAssignmentMetadataChanged
    | IActionReviewersSetCurrentReviewer
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case WS_REVIEWERS_USER_CONNECTED:
            const theUserIndex = state.users.findIndex((user: IReviewerUser) => user.id === action.user.id)
            if (theUserIndex !== -1) {
                return dotProp.set(state, `users.${theUserIndex}`, action.user)
            } else {
                return dotProp.set(state, `users.$end`, action.user)
            }
        case WS_REVIEWERS_LIST_USERS:
            return dotProp.set(state, "users", action.users)
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            return dotProp.set(state, "assignments", action.assignments)
        case SET_CURRENT_REVIEWER:
            return dotProp.set(state, "currentReviewerId", action.reviewerId)
        case WS_REVIEWERS_ASSIGN:
        case WS_REVIEWERS_ASSIGNMENT_UPDATED:
            return dotProp.set(state, `assignments.${action.assignment.id}`, action.assignment)
        case WS_REVIEWERS_BULK_ASSIGN:
            action.assignments.forEach(
                (assignment: IReviewerAssignment) => (state = dotProp.set(state, `assignments.${assignment.id}`, assignment))
            )
            return state
        case WS_REVIEWERS_UNASSIGN:
            return dotProp.delete(state, `assignments.${action.assignmentId}`)
        case WS_REVIEWERS_ASSIGNMENT_METADATA_CHANGED:
            return dotProp.set(state, `assignments.${action.assignment.id}`, action.assignment)
        case WS_REVIEWERS_SET_STATUS:
            const userIndex = state.users.findIndex((user: IReviewerUser) => user.id === action.user_id)
            return dotProp.set(state, `users.${userIndex}.is_accepting_assignments`, action.is_accepting_assignments)
        default:
            return state
    }
}

// Selectors
const getAssignments = (state: IStore) => state.reviewers.assignments
const getReviewers = (state: IStore) => state.reviewers.users
const getCurrentReviewerUserId = (state: IStore) => (state.reviewers.currentReviewerId ? state.reviewers.currentReviewerId : null)

export const getActiveAssignments = createSelector(
    [getAssignments],
    (assignments: IReviewerAssignment[]): any => {
        return Object.values(assignments).filter(
            (assignment: IReviewerAssignment, index: number) => assignment.state === eSocialAssignmentState.PENDING
        )
    }
)

export const getUserAssignments = createSelector(
    [getActiveAssignments],
    assignments =>
        memoize((userId: number | undefined) => {
            return userId === undefined ? [] : assignments.filter((assignment: IReviewerAssignment) => assignment.user_id === userId)
        })
)

export const getPendingUserAssignments = createSelector(
    [getActiveAssignments],
    assignments =>
        memoize((userId: number | undefined) => {
            return userId === undefined
                ? []
                : assignments.filter(
                      (assignment: IReviewerAssignment) =>
                          assignment.user_id === userId && assignment.state === eSocialAssignmentState.PENDING
                  )
        })
)

export const getUserAssignmentTotals = createSelector(
    [getActiveAssignments, getReviewers],
    (assignments: IReviewerAssignment[], reviewers: IReviewerUser[]): IReviewerAssignmentCounts => {
        const totals: IReviewerAssignmentCounts = {}
        reviewers.forEach((reviewer: IReviewerUser) => (totals[reviewer.id] = 0))
        assignments.forEach((assignment: IReviewerAssignment) => {
            totals[assignment.user_id] += 1
        })
        return totals
    }
)

export const getCurrentReviewerAssignments = createSelector(
    [getActiveAssignments, getCurrentReviewerUserId],
    (assignments: IReviewerAssignment[], userId: number | null) => {
        return userId === null ? [] : assignments.filter((assignment: IReviewerAssignment) => assignment.user_id === userId)
    }
)

export const getSortedAssignments = createSelector(
    [getCurrentReviewerAssignments],
    assignments =>
        memoize((userSettings: IProfileSettings) => {
            return sortBy(assignments, (assignment: IReviewerAssignment) =>
                userSettings.queue_sort_by === eQueueSortBy.ByCreation ? assignment.created_on : assignment.last_updated_on
            )
        })
)

export const getCurrentReviewer = createSelector(
    [getReviewers, getCurrentReviewerUserId],
    (users: IReviewerUser[], userId: number | null) => {
        return userId === null ? null : users.find((reviewer: IReviewerUser) => reviewer.id === userId)
    }
)

export const getReviewerById = createSelector(
    [getReviewers],
    (users: IReviewerUser[]) =>
        memoize((userId: number | null) => {
            return users.find((user: IReviewerUser) => userId === user.id)
        })
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

export enum eSocialAssignmentState {
    PENDING = "Pending",
    CLOSED = "Closed",
}

export enum eSocialAssignmentCloseReason {
    AWAITING_REPLY = "Awaiting Reply",
    MAP_UPDATED = "Map Updated",
    NO_CHANGE_REQUIRED = "No Change Required",
    NOT_RELEVANT = "Not Relevant",
    NOT_ACTIONED = "Not Actioned",
}

export interface IReviewerUser {
    id: number
    initials: string
    profile_image_url: string
    is_accepting_assignments: boolean
    name: string
    username: string
}

export interface IReviewerAssignment {
    id: number
    platform: eSocialPlatformChoice
    social_id: string
    state: eSocialAssignmentState
    close_reason: eSocialAssignmentCloseReason | null
    user_id: number
    thread_relationships: IReviewerAssignmentThreadRelationships[]
    thread_tweets: string[]
    created_on: string // datetime
    last_updated_on: string // datetime
    last_read_on: string | null // datetime
}

export interface IReviewerAssignmentThreadRelationships {
    [key: string]: string
}

export interface IReviewerAssignmentCounts {
    [key: string]: number
}
export interface IActionReviewersSetCurrentReviewer extends Action<typeof SET_CURRENT_REVIEWER> {
    reviewerId: number
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera

export function changeCurrentReviewer(userId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(setCurrentReviewer(userId))
    }
}

export function assignReviewer(tweetId: string, reviewerId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/assign_reviewer/", dispatch, {
            tweetId,
            reviewerId,
        })
    }
}

export function unassignReviewer(assignmentId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/unassign_reviewer/", dispatch, {
            assignmentId,
        })
    }
}

export function reassignReviewer(assignmentId: number, newReviewerId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/reassign_reviewer/", dispatch, {
            assignmentId,
            newReviewerId,
        })
    }
}

export function bulkReassignReviewer(currentReviewerId: number, newReviewerId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/bulk_reassign_reviewer/", dispatch, {
            currentReviewerId,
            newReviewerId,
        })
    }
}

export function closeAssignment(assignment: IReviewerAssignment, reason: eSocialAssignmentCloseReason) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/close/", dispatch, {
            assignmentId: assignment.id,
            reason,
        })
    }
}

export function restoreAssignment(assignment: IReviewerAssignment) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/restore/", dispatch, {
            assignmentId: assignment.id,
        })
    }
}

export function markAssignmentRead(assignment: IReviewerAssignment) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/mark_read/", dispatch, {
            assignmentId: assignment.id,
        })
    }
}

export function setReviewerOnlineStatus(userId: number, isAcceptingAssignments: boolean) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_assignments/set_user_accepting_assignments/", dispatch, {
            user_id: userId,
            is_accepting_assignments: isAcceptingAssignments,
        })
    }
}
