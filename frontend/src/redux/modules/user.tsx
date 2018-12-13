import * as dotProp from "dot-prop-immutable"
import { Action } from "redux"
import { IThunkExtras } from "../../redux/modules/interfaces"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_USER = "scremsong/user/LOAD_USER"

const initialState: IModule = {
    is_logged_in: false,
    user: null,
}

// Reducer
type IAction = IActionLoaderUser
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_USER:
            state = dotProp.set(state, "is_logged_in", action.is_logged_in)
            return dotProp.set(state, "user", action.user)
        default:
            return state
    }
}

// Action Creators
export const loadUser = (self: ISelf): IActionLoaderUser => ({
    type: LOAD_USER,
    ...self,
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
