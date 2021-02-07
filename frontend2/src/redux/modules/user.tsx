/* eslint-disable no-param-reassign */
import * as dotProp from 'dot-prop-immutable'
import { Action } from 'redux'
import { IMyWindow, IThunkExtras } from './interfaces'
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// eslint-disable-next-line no-var
declare var window: IMyWindow

// Actions
const LOAD_USER = 'scremsong/user/LOAD_USER'
const CHANGE_SETTINGS = 'scremsong/user/CHANGE_SETTINGS'

const initialState: IModule = {
  is_logged_in: false,
  user: null,
}

// Reducer
type IAction = IActionLoaderUser | IActionChangeSettings
export default function reducer(state: IModule = initialState, action: IAction) {
  switch (action.type) {
    case LOAD_USER:
      state = dotProp.set(state, 'is_logged_in', action.is_logged_in)
      return dotProp.set(state, 'user', action.user)
    case CHANGE_SETTINGS:
      return dotProp.set(state, 'user.settings', action.settings)
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
  queue_sort_by: EQueueSortBy
  column_positions: { [key: number]: IProfileColumnPosition }
  triage_only_show_assigned_columns: boolean
}

export interface IProfileColumnPosition {
  firstTweet: string
  firstVisibleTweet: string
  stopIndex: string
}

export enum EQueueSortBy {
  ByCreation = 1,
  ByModified = 2,
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchUser() {
  // return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
  return async (dispatch: Function, _getState: Function, { api }: IThunkExtras) => {
    const { response, json } = await api.get('/0.1/self', dispatch)
    if (response.status === 200) {
      dispatch(loadUser(json as ISelf))
      return json
    }
    return null
  }
}

export function logoutUser() {
  // return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
  return async (dispatch: Function, _getState: Function, { api }: IThunkExtras) => {
    await api.get('/0.1/logout', dispatch)
    // window.location.reload()
  }
}

export function changeUserProfileSettings(settings: Partial<IProfileSettings>) {
  // return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
  return async (dispatch: Function, _getState: Function, { api }: IThunkExtras) => {
    const { response, json } = await api.post('/0.1/profile/update_settings/', settings, dispatch)

    if (response.status === 200) {
      dispatch(changeSettings(json.settings))
    }
  }
}

export function wsChangeUserProfileSettings(settings: Partial<IProfileSettings>) {
  // return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
  return async (_dispatch: Function, _getState: Function, { emit }: IThunkExtras) => {
    emit({ type: 'ws/scremsong/user/CHANGE_SETTINGS', settings })
  }
}

export async function getColumnPosition(columnId: number): Promise<IProfileColumnPosition> {
  const { json } = await window.api.get('/0.1/profile/get_column_position/', null, { id: columnId })
  return (json as any).position
}
