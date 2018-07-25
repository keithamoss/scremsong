import * as dotProp from "dot-prop-immutable"
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
            return dotProp.set(state, "tweets", action.tweets)
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

// Models
export interface IModule {
    loading: boolean
    requestsInProgress: number
    sidebarOpen: boolean
    tweets: object[]
}

export interface IAction {
    type: string
    open?: boolean
    tweets?: object[]
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
            await Promise.all([dispatch(fetchTweets())])
        }

        dispatch(loaded())
    }
}

export function fetchTweets() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { response, json } = await api.get("/api/0.1/tweets/get_some_tweets/", dispatch)
        if (response.status === 200) {
            dispatch(loadTweets(json))
            return json
        }
    }
}
