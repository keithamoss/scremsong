import * as dotProp from "dot-prop-immutable"
import { Action } from "redux"
import { IThunkExtras } from "../../redux/modules/interfaces"
import { changeCurrentReviewer } from "./reviewers"
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
type IAction = IActionLoading | IActionLoaded | IActionBeginFetch | IActionFinishFetch | IActionToggleSidebar
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
export const loading = (): IActionLoading => ({
    type: LOADING,
})

export const loaded = (): IActionLoaded => ({
    type: LOADED,
})

export const beginFetch = (): IActionBeginFetch => ({
    type: BEGIN_FETCH,
})

export const finishFetch = (): IActionFinishFetch => ({
    type: FINISH_FETCH,
})

export const toggleSidebarState = (): IActionToggleSidebar => ({
    type: TOGGLE_SIDEBAR,
})

// Models
export interface IModule {
    loading: boolean
    requestsInProgress: number
    sidebarOpen: boolean
}

export interface IActionLoading extends Action<typeof LOADING> {}

export interface IActionLoaded extends Action<typeof LOADED> {}

export interface IActionBeginFetch extends Action<typeof BEGIN_FETCH> {}

export interface IActionFinishFetch extends Action<typeof FINISH_FETCH> {}

export interface IActionToggleSidebar extends Action<typeof TOGGLE_SIDEBAR> {}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function getEnvironment(): eAppEnv {
    return process.env.NODE_ENV === "development" ? eAppEnv.DEV : eAppEnv.PROD
}

export function getAPIBaseURL(): string {
    return process.env.REACT_APP_API_BASE_URL!
}

export function fetchInitialAppState() {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(loading())

        const self: ISelf = await dispatch(fetchUser())
        if (self.is_logged_in === true) {
            await dispatch(changeCurrentReviewer(self.user))
        }

        dispatch(loaded())
    }
}
