import * as dotProp from "dot-prop-immutable"
import { Action } from "redux"
import { IActionNotification } from "../../websockets/actions"
import { WS_NOTIFICATION } from "../../websockets/constants"
import { IThunkExtras } from "./interfaces"
import { changeCurrentReviewer } from "./reviewers"
import { fetchUser, ISelf } from "./user"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOADING = "scremsong/app/LOADING"
const LOADED = "scremsong/app/LOADED"
const CONNECTED = "scremsong/app/CONNECTED"
const DISCONNECTED = "scremsong/app/DISCONNECTED"
const BEGIN_FETCH = "scremsong/app/BEGIN_FETCH"
const FINISH_FETCH = "scremsong/app/FINISH_FETCH"
const TOGGLE_SIDEBAR = "scremsong/app/TOGGLE_SIDEBAR"
const REMOVE_SNACKBAR = "scremsong/app/REMOVE_SNACKBAR"

export enum eAppEnv {
    DEV = 1,
    TEST = 2,
    PROD = 3,
}

const initialState: IModule = {
    loading: true,
    connected: false,
    requestsInProgress: 0,
    sidebarOpen: false,
    notifications: [],
}

// Reducer
type IAction =
    | IActionLoading
    | IActionLoaded
    | IActionConnected
    | IActionDisconnected
    | IActionBeginFetch
    | IActionFinishFetch
    | IActionToggleSidebar
    | IActionRemoveSnackbar
    | IActionNotification
export default function reducer(state: IModule = initialState, action: IAction) {
    let requestsInProgress = dotProp.get(state, "requestsInProgress")

    switch (action.type) {
        case LOADING:
            return dotProp.set(state, "loading", true)
        case LOADED:
            return dotProp.set(state, "loading", false)
        case CONNECTED:
            return dotProp.set(state, "connected", true)
        case DISCONNECTED:
            return dotProp.set(state, "connected", false)
        case BEGIN_FETCH:
            return dotProp.set(state, "requestsInProgress", ++requestsInProgress)
        case FINISH_FETCH:
            return dotProp.set(state, "requestsInProgress", --requestsInProgress)
        case TOGGLE_SIDEBAR:
            return dotProp.toggle(state, "sidebarOpen")
        case WS_NOTIFICATION:
            return dotProp.set(state, "notifications.$end", action)
        case REMOVE_SNACKBAR:
            const notificationIndex = state.notifications.findIndex((notification: INotification) => notification.key === action.key)
            return dotProp.delete(state, `notifications.${notificationIndex}`)
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
export const connected = (): IActionConnected => ({
    type: CONNECTED,
})
export const disconnected = (): IActionDisconnected => ({
    type: DISCONNECTED,
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

export const removeSnackbar = (key: string): IActionRemoveSnackbar => ({
    type: REMOVE_SNACKBAR,
    key,
})

// Models
export interface IModule {
    loading: boolean
    connected: boolean
    requestsInProgress: number
    sidebarOpen: boolean
    notifications: []
}

export interface IActionLoading extends Action<typeof LOADING> {}

export interface IActionLoaded extends Action<typeof LOADED> {}

export interface IActionConnected extends Action<typeof CONNECTED> {}

export interface IActionDisconnected extends Action<typeof DISCONNECTED> {}

export interface IActionBeginFetch extends Action<typeof BEGIN_FETCH> {}

export interface IActionFinishFetch extends Action<typeof FINISH_FETCH> {}

export interface IActionToggleSidebar extends Action<typeof TOGGLE_SIDEBAR> {}

export interface IActionRemoveSnackbar extends Action<typeof REMOVE_SNACKBAR> {
    key: string
}

export interface INotification {
    message: string
    options: INotificationOptions
    key: string
}

export enum eNotificationVariant {
    DEFAULT = "default",
    ERROR = "error",
    SUCCESS = "success",
    WARNING = "warning",
    INFO = "info",
}

export interface INotificationOptions {
    variant: eNotificationVariant
    onClickAction?: Function
    autoHideDuration?: number
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
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(loading())

        const self: ISelf = await dispatch(fetchUser())
        if (self.is_logged_in === true) {
            await dispatch(changeCurrentReviewer(self.user.id))
        } else {
            // Show them the login box
            // If they're logged in a succesful web socket connection fires this
            dispatch(loaded())
        }
    }
}
