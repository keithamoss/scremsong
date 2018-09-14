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
const LOAD_TWEETS = "ealgis/app/LOAD_TWEETS"
const LOAD_NEW_TWEETS = "ealgis/app/LOAD_NEW_TWEETS"
const DISMISS_TWEET = "ealgis/app/DISMISS_TWEET"
const LOAD_COLUMNS = "ealgis/app/LOAD_COLUMNS"

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
        case LOAD_TWEETS:
            // @ts-ignore
            action.tweets!.columns.forEach((column: any, index: number) => {
                if (column.tweets.length === 0 && (!(column.id in state.column_tweets) || state.column_tweets![column.id].length === 0)) {
                    state = dotProp.set(state, `column_tweets.${column.id}`, [])
                } else {
                    state = dotProp.set(state, `column_tweets.${column.id}`, uniq([...state.column_tweets![column.id], ...column.tweets]))
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
                // @ts-ignore
                state = dotProp(state, `columns[columnIndex].total_tweets`, state.columns[columnIndex].total_tweets + column.tweets.length)
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

export function loadColumns(columns: object[]) {
    return {
        type: LOAD_COLUMNS,
        columns,
    }
}

// Models
export interface IModule {
    loading: boolean
    requestsInProgress: number
    sidebarOpen: boolean
    tweets: object[]
    columns: object[]
    column_tweets: any
}

export interface IAction {
    type: string
    open?: boolean
    tweets?: object[]
    tweetId?: string
    columns?: object[]
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
            await Promise.all([dispatch(fetchTweets(0, 20))])
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
        if (json.tweets.length > 0) {
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

export function dismissATweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        dispatch(dismissTweet(tweetId))
        await api.get("/api/0.1/tweets/dismiss/", dispatch, {
            tweetId,
        })
    }
}
