import * as dotProp from "dot-prop-immutable"
import { Action } from "redux"
import { IMyWindow, IThunkExtras } from "../../redux/modules/interfaces"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_USER = "scremsong/user/LOAD_USER"
const CHANGE_SETTINGS = "scremsong/user/CHANGE_SETTINGS"

const initialState: IModule = {
    is_logged_in: false,
    user: null,
}

// Reducer
type IAction = IActionLoaderUser | IActionChangeSettings
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_USER:
            state = dotProp.set(state, "is_logged_in", action.is_logged_in)
            return dotProp.set(state, "user", action.user)
        case CHANGE_SETTINGS:
            return dotProp.set(state, "user.settings", action.settings)
        default:
            return state
    }
}

// Action Creators
export const loadUser = (self: ISelf): IActionLoaderUser => ({
    type: LOAD_USER,
    ...self,
})
export const changeSettings = (settings: IProfileSettings): IActionChangeSettings => ({
    type: CHANGE_SETTINGS,
    settings,
})

// Models
export interface IModule {
    is_logged_in: boolean
    user: IUser | null
}

export interface IActionLoaderUser extends Action<typeof LOAD_USER> {
    is_logged_in: boolean
    user: IUser
}

export interface IActionChangeSettings extends Action<typeof CHANGE_SETTINGS> {
    settings: IProfileSettings
}

export interface ISelf {
    is_logged_in: boolean
    user: IUser
}

export interface IUser {
    username: string
    email: string
    first_name: string
    last_name: string
    date_joined: string // datetime
    groups: string[]
    id: number
    is_active: boolean
    is_approved: boolean
    is_staff: boolean
    settings: IProfileSettings
}

export interface IProfileSettings {
    queue_sort_by: eQueueSortBy
    column_positions: { [key: number]: IProfileColumnPosition }
}

export interface IProfileColumnPosition {
    firstTweet: string
    firstVisibleTweet: string
    stopIndex: string
}

export enum eQueueSortBy {
    ByCreation = 1,
    ByModified = 2,
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchUser() {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        const { response, json } = await api.get("/api/0.1/self", dispatch)
        if (response.status === 200) {
            dispatch(loadUser(json))
            return json
        }
    }
}

export function logoutUser() {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/logout", dispatch)
        // window.location.reload()
    }
}

export function changeUserProfileSettings(settings: Partial<IProfileSettings>) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        const { json } = await api.post("/api/0.1/profile/update_settings/", settings, dispatch)
        dispatch(changeSettings(json.settings))
    }
}

export function ws_changeUserProfileSettings(settings: Partial<IProfileSettings>) {
    return (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        emit({ type: "ws/scremsong/user/CHANGE_SETTINGS", settings })
    }
}

declare var window: IMyWindow
export async function getColumnPosition(columnId: number): Promise<IProfileColumnPosition> {
    const { json } = await window.api.get("/api/0.1/profile/get_column_position/", null, { id: columnId })
    return json.position
}
