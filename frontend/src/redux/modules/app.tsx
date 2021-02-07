import * as dotProp from 'dot-prop-immutable'
import { Action } from 'redux'
import { createSelector } from 'reselect'
import { IRateLimitResources, IResourceRateLimit } from '../../admin_panel/TwitterRateLimitStatus/types'
import { randomHash, sortObjectKeys } from '../../utils'
import {
  IActionNotification,
  IActionsSocialPlatformsSettings,
  IActionTweetsRateLimitResources,
  IActionTweetsRateLimitState,
  IActionTweetsStreamingState,
  INotification,
  ISocialPlatformSettings,
} from '../../websockets/actions'
import {
  WS_NOTIFICATION,
  WS_SOCIALPLATFORMS_SETTINGS,
  WS_TWEETS_RATE_LIMIT_RESOURCES,
  WS_TWEETS_RATE_LIMIT_STATE,
  WS_TWEETS_STREAMING_STATE,
} from '../../websockets/constants'
import { ESocialPlatformChoice } from './interfaces.reviewers'
import { IStore } from './reducer'
import { ESocialTwitterRateLimitState } from './social'
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOADING = 'scremsong/app/LOADING'
const LOADED = 'scremsong/app/LOADED'
const CONNECTED = 'scremsong/app/CONNECTED'
const DISCONNECTED = 'scremsong/app/DISCONNECTED'
const BEGIN_FETCH = 'scremsong/app/BEGIN_FETCH'
const FINISH_FETCH = 'scremsong/app/FINISH_FETCH'
const TOGGLE_SIDEBAR = 'scremsong/app/TOGGLE_SIDEBAR'
const REMOVE_SNACKBAR = 'scremsong/app/REMOVE_SNACKBAR'
const SEND_NOTIFICATION = 'scremsong/app/SEND_NOTIFICATION'
const SETTINGS_DIALOG_STATE = 'scremsong/app/SETTINGS_DIALOG_STATE'

export enum EAppEnv {
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
  tweet_streaming_connected: false,
  twitter_rate_limit_state: null,
  twitter_rate_limit_resources: null,
  settings_dialog_open: false,
  socialplatform_settings: {},
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
  | IActionSendNotification
  | IActionTweetsStreamingState
  | IActionTweetsRateLimitState
  | IActionTweetsRateLimitResources
  | IActionSettingsDialogState
  | IActionsSocialPlatformsSettings
export default function reducer(state: IModule = initialState, action: IAction) {
  let requestsInProgress = dotProp.get(state, 'requestsInProgress')

  switch (action.type) {
    case LOADING:
      return dotProp.set(state, 'loading', true)
    case LOADED:
      return dotProp.set(state, 'loading', false)
    case CONNECTED:
      return dotProp.set(state, 'connected', true)
    case DISCONNECTED:
      return dotProp.set(state, 'connected', false)
    case BEGIN_FETCH:
      // eslint-disable-next-line no-plusplus
      return dotProp.set(state, 'requestsInProgress', ++requestsInProgress)
    case FINISH_FETCH:
      // eslint-disable-next-line no-plusplus
      return dotProp.set(state, 'requestsInProgress', --requestsInProgress)
    case TOGGLE_SIDEBAR:
      return dotProp.toggle(state, 'sidebarOpen')
    case WS_NOTIFICATION:
    case SEND_NOTIFICATION:
      return dotProp.set(state, 'notifications.$end', action)
    case REMOVE_SNACKBAR: {
      const notificationIndex = state.notifications.findIndex(
        (notification: INotification) => notification.key === action.key
      )
      if (notificationIndex >= 0) {
        return dotProp.delete(state, `notifications.${notificationIndex}`)
      }
      return state
    }
    case WS_TWEETS_STREAMING_STATE:
      return dotProp.set(state, 'tweet_streaming_connected', action.connected)
    case WS_TWEETS_RATE_LIMIT_STATE:
      return dotProp.set(state, 'twitter_rate_limit_state', action.state)
    case WS_TWEETS_RATE_LIMIT_RESOURCES:
      return dotProp.set(state, 'twitter_rate_limit_resources', action.resources)
    case SETTINGS_DIALOG_STATE:
      return dotProp.set(state, 'settings_dialog_open', action.state)
    case WS_SOCIALPLATFORMS_SETTINGS:
      return dotProp.set(state, 'socialplatform_settings', action.settings)
    default:
      return state
  }
}

// Selectors
const getTwitterRateLimitResources = (state: IStore) => state.app.twitter_rate_limit_resources
const getSocialPlatformSettings = (state: IStore) => state.app.socialplatform_settings

export const getTwitterSettings = createSelector(
  [getSocialPlatformSettings],
  (settings: ISocialPlatformSettings): any => {
    return settings[ESocialPlatformChoice.TWITTER]
  }
)

export const getConsumedTwitterRateLimitResources = createSelector(
  [getTwitterRateLimitResources],
  (rateLimitResources: IRateLimitResources | null): any => {
    const filteredRateLimitResources = {}

    if (rateLimitResources !== null) {
      for (const [resourceGroupName, resources] of Object.entries(rateLimitResources)) {
        const filteredResources = Object.keys(resources)
          .filter((resourceName: string) => resources[resourceName].remaining < resources[resourceName].limit)
          .reduce((rateLimitInfo: IResourceRateLimit, resourceName: string) => {
            return {
              ...rateLimitInfo,
              [resourceName]: rateLimitResources[resourceGroupName][resourceName],
            }
          }, {} as IResourceRateLimit)

        if (Object.keys(filteredResources).length > 0) {
          filteredRateLimitResources[resourceGroupName] = filteredResources
        }
      }
    }

    // Sort remaining results to maintain a consistent order
    return Object.keys(filteredRateLimitResources).length > 0 ? sortObjectKeys(filteredRateLimitResources) : null
  }
)

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

export const sendNotification = (notification: Partial<INotification>): IActionSendNotification => ({
  type: SEND_NOTIFICATION,
  ...({ ...notification, key: randomHash(32) } as INotification),
})

export const changeSettingsDialogState = (state: boolean): IActionSettingsDialogState => ({
  type: SETTINGS_DIALOG_STATE,
  state,
})

// Models
export interface IModule {
  loading: boolean
  connected: boolean
  requestsInProgress: number
  sidebarOpen: boolean
  notifications: []
  tweet_streaming_connected: boolean
  twitter_rate_limit_state: ESocialTwitterRateLimitState | null
  twitter_rate_limit_resources: IRateLimitResources | null
  settings_dialog_open: boolean
  socialplatform_settings: ISocialPlatformSettings
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

export interface IActionSendNotification extends Action<typeof SEND_NOTIFICATION>, INotification {}

export interface IActionSettingsDialogState extends Action<typeof SETTINGS_DIALOG_STATE> {
  state: boolean
}

export enum ENotificationVariant {
  DEFAULT = 'default',
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
}

export interface IDashboardStats {
  assignments: {
    // all_time: {
    //     [key: string]: IDashboardStatsUserAssignments // key = userId
    // }
    past_week: {
      [key: string]: IDashboardStatsUserAssignments // key = userId
    }
  }
  triage: {
    // all_time: {
    //     [key: string]: IDashboardStatsTriage // key = columnId
    // }
    past_week: {
      [key: string]: IDashboardStatsTriage // key = columnId
    }
  }
}

export interface IDashboardStatsUserAssignments {
  'Awaiting Reply': number
  'Map Updated': number
  'No Change Required': number
  'Not Relevant': number
  Pending: number
}

export interface IDashboardStatsTriage {
  'TweetState.ACTIVE': number
  'TweetState.DEALT_WITH': number
  'TweetState.DISMISSED': number
  'TweetState.ASSIGNED': number
  'TweetState.NOT_ACTIONED': number
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function getEnvironment(): EAppEnv {
  return process.env.NODE_ENV === 'development' ? EAppEnv.DEV : EAppEnv.PROD
}

export function isDevEnvironment(): boolean {
  return getEnvironment() === EAppEnv.DEV
}

export function getAPIBaseURL(): string {
  return process.env.REACT_APP_API_BASE_URL!
}
