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

export enum eAppEnv {
    DEV = 1,
    TEST = 2,
    PROD = 3,
}

const initialState: IModule = {
    loading: true,
    requestsInProgress: 0,
    sidebarOpen: false,
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

// Models
export interface IModule {
    loading: boolean
    requestsInProgress: number
    sidebarOpen: boolean
}

export interface IAction {
    type: string
    open?: boolean
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
    return getEnvironment() === eAppEnv.DEV ? "http://localhost:8000" : "http://api.democracysausage.org"
}

export function fetchInitialAppState() {
    return async (dispatch: Function, getState: Function, ealapi: APIClient) => {
        dispatch(loading())

        const self: ISelf = await dispatch(fetchUser())
        if (self.success === false) {
            // await Promise.all([
            //     dispatch(fetchSomething()),
            // ])
        }

        dispatch(loaded())
    }
}
