import * as dotProp from "dot-prop-immutable"
import { uniq } from "lodash-es"
import { APIClient } from "../../redux/modules/interfaces"
import { fetchUser, ISelf } from "./user"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOADING = "ealgis/app/LOADING"
const LOADED = "ealgis/app/LOADED"
const BEGIN_FETCH = "ealgis/app/BEGIN_FETCH"
const FINISH_FETCH = "ealgis/app/FINISH_FETCH"
const TOGGLE_SIDEBAR = "ealgis/app/TOGGLE_SIDEBAR"
const LOAD_TWEET_OBJECTS = "ealgis/app/LOAD_TWEET_OBJECTS"
const LOAD_TWEETS = "ealgis/app/LOAD_TWEETS"
const LOAD_NEW_TWEETS = "ealgis/app/LOAD_NEW_TWEETS"
const DISMISS_TWEET = "ealgis/app/DISMISS_TWEET"
const LOAD_COLUMNS = "ealgis/app/LOAD_COLUMNS"
const LOAD_REVIEWERS = "ealgis/app/LOAD_REVIEWERS"
const ASSIGN_REVIEWER = "ealgis/app/ASSIGN_REVIEWER"
const UNASSIGN_REVIEWER = "ealgis/app/UNASSIGN_REVIEWER"
const LOAD_ASSIGNMENTS = "ealgis/app/LOAD_ASSIGNMENTS"
const MARK_ASSIGNMENT_DONE = "ealgis/app/MARK_ASSIGNMENT_DONE"

export enum eAppEnv {
    DEV = 1,
    TEST = 2,
    PROD = 3,
}

const initialState: IModule = {
    loading: true,
    requestsInProgress: 0,
    sidebarOpen: false,
    tweets: [],
    columns: [],
    reviewers: {},
    assignments: [],
    column_tweets: {},
}

// Reducer
export default function reducer(state: IModule = initialState, action: IAction) {
    let requestsInProgress = dotProp.get(state, "requestsInProgress")

    switch (action.type) {
        case LOADING:
            return dotProp.set(state, "loading", true)
        case LOADED:
            return dotProp.set(state, "loading", false)
        case BEGIN_FETCH:
            return dotProp.set(state, "requestsInProgress", ++requestsInProgress)
        case FINISH_FETCH:
            return dotProp.set(state, "requestsInProgress", --requestsInProgress)
        case TOGGLE_SIDEBAR:
            return dotProp.toggle(state, "sidebarOpen")
        case LOAD_TWEET_OBJECTS:
            return dotProp.set(state, "tweets", { ...action.tweets, ...state.tweets })
        case LOAD_TWEETS:
            // @ts-ignore
            action.tweets!.columns.forEach((column: any, index: number) => {
                if (column.tweets.length === 0 && (!(column.id in state.column_tweets) || state.column_tweets![column.id].length === 0)) {
                    state = dotProp.set(state, `column_tweets.${column.id}`, [])
                } else {
                    const val = uniq([...state.column_tweets![column.id], ...column.tweets])
                    // Bodge bodge bodge - sort visible column tweets by their ids to maintain the correct order
                    // fetchTweets() returns tweets to go on the bottom of the list (older tweets), but fetchLatestTweets()
                    // returns new tweets to go at the start of the list.
                    // Refactor later on.
                    const sorted = val.sort().reverse()
                    // console.log(
                    //     `Adding ${column.tweets.length} tweets to column_tweets[${column.id}]. Old length = ${
                    //         state.column_tweets![column.id]
                    //     }; New length = ${sorted.length}.`
                    // )
                    // console.log(column.tweets)

                    state = dotProp.set(state, `column_tweets.${column.id}`, sorted)
                }
            })
            // @ts-ignore
            return dotProp.set(state, "tweets", { ...action.tweets.tweets!, ...state.tweets })
        case LOAD_NEW_TWEETS:
            // @ts-ignore
            action.tweets!.columns.forEach((column: any, index: number) => {
                const columnIndex = state.columns.findIndex((col: any) => {
                    return col.id === column.id
                })
                // console.log(
                //     `Incrementing tweet counter for ${column.id} (index = ${columnIndex}). Old value = ${
                //         state.columns[columnIndex].total_tweets
                //     }; New value = ${state.columns[columnIndex].total_tweets + column.tweets.length}.`
                // )

                // @ts-ignore
                state = dotProp.set(
                    state,
                    `columns.${columnIndex}.total_tweets`,
                    state.columns[columnIndex].total_tweets + column.tweets.length
                )
            })

            return state
        case LOAD_COLUMNS:
            const columnTweets: any = {}
            action.columns!.forEach((column: any, index: number) => {
                columnTweets[column.id] = []
            })

            state = dotProp.set(state, "column_tweets", columnTweets)
            return dotProp.set(state, "columns", action.columns)
        case DISMISS_TWEET:
            return dotProp.set(state, `tweets.${action.tweetId}.is_dismissed`, true)
        case LOAD_REVIEWERS:
            // @ts-ignore
            action.reviewers.forEach((reviewer: any, index: number) => {
                state = dotProp.set(state, `reviewers.${reviewer.id}`, reviewer)
            })
            return state
        case ASSIGN_REVIEWER:
            state = dotProp.set(state, `tweets.${action.tweetId}.reviewer_id`, action.reviewerId)
            return dotProp.set(state, `tweets.${action.tweetId}.review_status`, "SocialAssignmentStatus.PENDING")
        case UNASSIGN_REVIEWER:
            state = dotProp.delete(state, `tweets.${action.tweetId}.reviewer_id`)
            return dotProp.delete(state, `tweets.${action.tweetId}.review_status`)
        case LOAD_ASSIGNMENTS:
            // @ts-ignore
            // action.assignments.forEach((assignment: any, index: number) => {
            //     state = dotProp.set(state, `assignments.${assignment.id}`, assignment)
            // })
            // return state
            return dotProp.set(state, "assignments", [...action.assignments, ...state.assignments])
        case MARK_ASSIGNMENT_DONE:
            const assignmentIndex = state.assignments.findIndex((assignment: any) => assignment.id === action.assignmentId)
            // return dotProp.set(state, `assignments.${assignmentIndex}.status`, "SocialAssignmentStatus.DONE")
            return dotProp.delete(state, `assignments.${assignmentIndex}`)
        default:
            return state
    }
}

// Action Creators
export function loading(): IAction {
    return {
        type: LOADING,
    }
}

export function loaded(): IAction {
    return {
        type: LOADED,
    }
}

export function beginFetch(): IAction {
    return {
        type: BEGIN_FETCH,
    }
}

export function finishFetch(): IAction {
    return {
        type: FINISH_FETCH,
    }
}

export function toggleSidebarState(): IAction {
    return {
        type: TOGGLE_SIDEBAR,
        meta: {
            analytics: {
                category: "App",
            },
        },
    }
}

export function loadTweetObjects(tweets: object[]) {
    return {
        type: LOAD_TWEET_OBJECTS,
        tweets,
    }
}

export function loadTweets(tweets: object[]) {
    return {
        type: LOAD_TWEETS,
        tweets,
    }
}

export function loadNewTweets(tweets: object[]) {
    return {
        type: LOAD_NEW_TWEETS,
        tweets,
    }
}

export function dismissTweet(tweetId: string) {
    return {
        type: DISMISS_TWEET,
        tweetId,
    }
}

export function assignReviewer(tweetId: string, reviewerId: number) {
    return {
        type: ASSIGN_REVIEWER,
        tweetId,
        reviewerId,
    }
}

export function unassignReviewer(tweetId: string) {
    return {
        type: UNASSIGN_REVIEWER,
        tweetId,
    }
}

export function loadColumns(columns: object[]) {
    return {
        type: LOAD_COLUMNS,
        columns,
    }
}

export function loadReviewers(reviewers: object[]) {
    return {
        type: LOAD_REVIEWERS,
        reviewers,
    }
}

export function loadAssignments(assignments: object[]) {
    return {
        type: LOAD_ASSIGNMENTS,
        assignments,
    }
}

export function markAnAssignmentDone(assignmentId: number) {
    return {
        type: MARK_ASSIGNMENT_DONE,
        assignmentId,
    }
}

// Models
export interface IModule {
    loading: boolean
    requestsInProgress: number
    sidebarOpen: boolean
    tweets: object[]
    columns: any[]
    reviewers: object
    assignments: object[]
    column_tweets: any
}

export interface IAction {
    type: string
    open?: boolean
    tweets?: object[]
    tweetId?: string
    reviewerId?: number
    columns?: any[]
    reviewers?: object[]
    assignments?: object[]
    assignmentId?: number
    column_tweets?: any
    meta?: {
        // analytics: IAnalyticsMeta
    }
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function getEnvironment(): eAppEnv {
    return process.env.NODE_ENV === "development" ? eAppEnv.DEV : eAppEnv.PROD
}

export function getAPIBaseURL(): string {
    return process.env.REACT_APP_API_BASE_URL!
}

export function fetchInitialAppState() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(loading())

        const self: ISelf = await dispatch(fetchUser())
        if (self.is_logged_in === true) {
            await dispatch(fetchColumns())
            await Promise.all([dispatch(fetchReviewers()), dispatch(fetchAssignments()), dispatch(fetchTweets(0, 20))])
        }

        dispatch(loaded())
    }
}

export function fetchTweets(startIndex: number, stopIndex: number, columns: any[] = []) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { json } = await api.get(
            "/api/0.1/tweets/get_some_tweets/",
            dispatch,
            {
                startIndex,
                stopIndex,
                columns: columns.join(","),
            },
            true
        )
        await dispatch(loadTweets(json))
    }
}

export function fetchLatestTweets(columns: any) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { json } = await api.get(
            "/api/0.1/tweets/get_some_tweets/",
            dispatch,
            {
                sinceId: Object.keys(getState().app.tweets)[0],
                columns: columns.reduce((arr: any, elem: any) => [...arr, ...elem.id], []).join(","),
            },
            true
        )
        if (Object.keys(json.tweets).length > 0) {
            await dispatch(loadNewTweets(json))
            await dispatch(loadTweets(json))
        }
    }
}

export function fetchColumns() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { response, json } = await api.get("/api/0.1/tweets/get_deck_columns/", dispatch)

        if (response.status === 200) {
            dispatch(loadColumns(json.columns))
            return json
        }
    }
}

export function fetchReviewers() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { response, json } = await api.get("/api/0.1/tweets/get_reviewer_users/", dispatch)

        if (response.status === 200) {
            dispatch(loadReviewers(json.reviewers))
            return json
        }
    }
}

export function dismissATweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(dismissTweet(tweetId))
        await api.get("/api/0.1/tweets/dismiss/", dispatch, {
            tweetId,
        })
    }
}

export function assignAReviewer(tweetId: string, reviewerId: number) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(assignReviewer(tweetId, reviewerId))
        await api.get("/api/0.1/tweets/assignReviewer/", dispatch, {
            tweetId,
            reviewerId,
        })
    }
}

export function unassignAReviewer(tweetId: string) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(unassignReviewer(tweetId))
        await api.get("/api/0.1/tweets/unassignReviewer/", dispatch, {
            tweetId,
        })
    }
}

export function fetchAssignments() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { response, json } = await api.get("/api/0.1/tweets/get_assignments/", dispatch)

        if (response.status === 200) {
            dispatch(loadAssignments(json.assignments))
            dispatch(loadTweetObjects(json.tweets))
            return json
        }
    }
}

export function fetchLatestAssignments(user: any) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        let params = {}
        if (getState().app.assignments.length > 0) {
            const latestAssignment = getState()
                .app.assignments.filter((assignment: any) => assignment.user_id === user.id)
                .reduce((prev: any, current: any) => (prev.id > current.id ? prev : current))
            params = {
                sinceId: latestAssignment.id,
            }
        }
        const { json } = await api.get("/api/0.1/tweets/get_assignments/", dispatch, params, true)

        if (json.assignments.length > 0) {
            dispatch(loadAssignments(json.assignments))
            dispatch(loadTweetObjects(json.tweets))
            return json
        }
    }
}

export function markAssignmentDone(assignment: any) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(markAnAssignmentDone(assignment.id))
        await api.get("/api/0.1/tweets/assignment_done/", dispatch, {
            assignmentId: assignment.id,
        })
    }
}

export function getUserAssignments(assignments: object[], user: any) {
    return assignments.filter((assignment: any) => assignment.user_id === user.id)
}
