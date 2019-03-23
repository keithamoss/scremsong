import { blueGrey, green, red, yellow } from "@material-ui/core/colors"
import * as dotProp from "dot-prop-immutable"
import { uniq } from "lodash-es"
import { Action } from "redux"
import {
    IActionSocialColumnsList,
    IActionSocialColumnsUpdate,
    IActionsTweetsLoadTweets,
    IActionTweetsNew,
    ITweetFetchColumn,
} from "../../websockets/actions"
import { WS_SOCIAL_COLUMNS_LIST, WS_SOCIAL_COLUMNS_UPDATE, WS_TWEETS_LOAD_TWEETS, WS_TWEETS_NEW_TWEETS } from "../../websockets/constants"
import { IThunkExtras } from "./interfaces"
import { eSocialAssignmentCloseReason, eSocialAssignmentState, IReviewerAssignment } from "./reviewers"
import { eSocialTweetState, ISocialTweet, ISocialTweetList, ISocialTweetsAndColumnsResponse } from "./social"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_TWEETS = "scremsong/triage/LOAD_TWEETS"
const LOAD_BUFFERED_TWEETS = "scremsong/triage/LOAD_BUFFERED_TWEETS"

const initialState: IModule = {
    columns: [],
    column_tweets: {},
    column_tweets_buffered: {},
}

// Reducer
type IAction =
    | IActionLoadTweets
    | IActionsTweetsLoadTweets
    | IActionTweetsNew
    | IActionLoadBufferedTweets
    | IActionSocialColumnsList
    | IActionSocialColumnsUpdate
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_LOAD_TWEETS:
            action.columns.forEach((column: ITweetFetchColumn, index: number) => {
                // Merge and then sort column tweetIds to maintain the correct order chronological order
                // tslint:disable-next-line:no-shadowed-variable
                const val = uniq([...state.column_tweets[column.id], ...column.tweet_ids])
                // tslint:disable-next-line:no-shadowed-variable
                const sorted = val.sort().reverse()
                state = dotProp.set(state, `column_tweets.${column.id}`, sorted)

                if (action.type === WS_TWEETS_LOAD_TWEETS) {
                    column.tweet_ids_buffered.forEach((tweetId: string) => {
                        if (dotProp.get(state, `column_tweets.${column.id}`).includes(tweetId) === false) {
                            state = dotProp.set(state, `column_tweets_buffered.${column.id}`, [
                                ...state.column_tweets_buffered[column.id],
                                ...[tweetId],
                            ])
                        }
                    })
                }
            })
            return state
        case WS_TWEETS_NEW_TWEETS:
            for (const [tweetId, columnIds] of Object.entries(action.columnIds)) {
                columnIds.forEach((columnId: number) => {
                    if (dotProp.get(state, `column_tweets.${columnId}`).includes(tweetId) === false) {
                        state = dotProp.set(state, `column_tweets_buffered.${columnId}`, [
                            ...state.column_tweets_buffered[columnId],
                            ...[tweetId],
                        ])
                    }
                })
            }
            return state
        case LOAD_BUFFERED_TWEETS:
            // Update the total tweet count for the columns
            const columnIndex = state.columns.findIndex((c: ITriageColumn) => c.id === action.columnId)
            const totalTweets = dotProp.get(state, `columns.${columnIndex}.total_tweets`)
            state = dotProp.set(
                state,
                `columns.${columnIndex}.total_tweets`,
                totalTweets + state.column_tweets_buffered[action.columnId].length
            )

            // Merge and then sort column tweetIds to maintain the correct order chronological order
            // NB: This relies solely on tweetIds being a number that increments with each new tweet
            // that we can use to infer the chronological order of a set of tweets.
            const val = uniq([...state.column_tweets[action.columnId], ...state.column_tweets_buffered[action.columnId]])
            const sorted = val.sort().reverse()
            state = dotProp.set(state, `column_tweets.${action.columnId}`, sorted)
            state = dotProp.set(state, `column_tweets_buffered.${action.columnId}`, [])
            return state
        case WS_SOCIAL_COLUMNS_LIST:
            // Initialise our store for the tweetIds associated with each column
            // Map our list of columns to an object of empty arrays indexed by columnId
            // e.g. {1: [], 2: []}
            const columnTweets: any = {}
            action.columns.forEach((column: ITriageColumn, index: number) => {
                columnTweets[column.id] = []
            })

            state = dotProp.set(state, "column_tweets", columnTweets)
            state = dotProp.set(state, "column_tweets_buffered", columnTweets)
            return dotProp.set(state, "columns", action.columns)
        case WS_SOCIAL_COLUMNS_UPDATE:
            action.columns.forEach((column: ITriageColumn) => {
                const columnIndex = state.columns.findIndex((c: ITriageColumn) => c.id === column.id)
                state = dotProp.set(state, `columns.${columnIndex}`, column)
            })
            return state
        default:
            return state
    }
}

// Action Creators
export const loadTweets = (json: ISocialTweetsAndColumnsResponse): IActionLoadTweets => ({
    type: LOAD_TWEETS,
    ...json,
})

export const loadBufferedTweets = (columnId: number): IActionLoadBufferedTweets => ({
    type: LOAD_BUFFERED_TWEETS,
    columnId,
})

// Models
export interface IModule {
    columns: ITriageColumn[]
    column_tweets: ITriageColumnTweets
    column_tweets_buffered: ITriageColumnTweets
}

export interface IActionLoadTweets extends Action<typeof LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {
    columns: ITweetFetchColumn[]
    tweets: ISocialTweetList
}

export interface IActionLoadBufferedTweets extends Action<typeof LOAD_BUFFERED_TWEETS> {
    columnId: number
}

export enum eSocialPlatformChoice {
    TWITTER = "SocialPlatformChoice.TWITTER",
}

export interface ITriageColumn {
    id: number
    platform: eSocialPlatformChoice
    search_phrases: string[]
    assigned_to: number | null
    total_tweets: number
}

export interface ITriageColumnTweets {
    [key: number]: string[]
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function loadBufferedTweetsForColumn(columnId: number) {
    return (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(loadBufferedTweets(columnId))
    }
}

export function assignTriagerToColumn(columnId: number, userId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_columns/assign_triager/", dispatch, {
            columnId,
            userId,
        })
    }
}

export function unassignTriagerFromColumn(columnId: number) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/0.1/social_columns/unassign_triager/", dispatch, {
            columnId,
        })
    }
}

// Utilities
export function getActionBarBackgroundColour(tweet: ISocialTweet, assignment: IReviewerAssignment | null) {
    if (assignment !== null) {
        if (assignment.state === eSocialAssignmentState.PENDING) {
            return yellow[200]
        } else if (assignment.state === eSocialAssignmentState.CLOSED) {
            if (assignment.close_reason === eSocialAssignmentCloseReason.AWAITING_REPLY) {
                return yellow[200]
            } else if (
                assignment.close_reason === eSocialAssignmentCloseReason.MAP_UPDATED ||
                assignment.close_reason === eSocialAssignmentCloseReason.NO_CHANGE_REQUIRED
            ) {
                return green[200]
            } else if (assignment.close_reason === eSocialAssignmentCloseReason.NOT_RELEVANT) {
                return blueGrey[200]
            }
        }
        return red[200]
    }

    if (tweet.state === eSocialTweetState.DISMISSED) {
        return blueGrey[200]
    } else if (tweet.state === eSocialTweetState.DEALT_WITH) {
        return green[200]
    }
    return red[200]

    return "transparent"
}
