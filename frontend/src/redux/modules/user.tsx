import * as dotProp from "dot-prop-immutable"
import { APIClient } from "../../redux/modules/interfaces"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_USER = "scremsong/user/LOAD_USER"

const initialState: IModule = {
    user: {} as IUser,
}

// Reducer
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_USER:
            return dotProp.set(state, "user", action.user)
        default:
            return state
    }
}

// Action Creators
export function loadUser(self: ISelf) {
    return {
        type: LOAD_USER,
        user: self.user || null,
    }
}

// Models
export interface IModule {
    user: IUser
}

export interface IAction {
    type: string
    user?: IUser
    meta?: {
        // analytics: IAnalyticsMeta
    }
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
    groups: any[]
    id: number
    is_active: boolean
    is_approved: boolean
    is_staff: boolean
    url: string
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchUser() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        const { response, json } = await api.get("/api/0.1/self", dispatch)
        if (response.status === 200) {
            dispatch(loadUser(json))
            return json
        }
    }
}

export function logoutUser() {
    return async (dispatch: Function, getState: Function, api: APIClient) => {
        await api.get("/api/0.1/logout", dispatch)
        // window.location.reload()
    }
}
