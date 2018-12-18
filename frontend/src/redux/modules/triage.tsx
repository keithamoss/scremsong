import * as dotProp from "dot-prop-immutable"
import { uniq } from "lodash-es"
import { Action } from "redux"
import { IActionSocialColumnsList, IActionsTweetsFetch, IActionTweetsNew, ITweetFetchColumn } from "../../websockets/actions"
import { WS_SOCIAL_COLUMNS_LIST, WS_TWEETS_LOAD_TWEETS, WS_TWEETS_NEW_TWEET } from "../../websockets/constants"
import { ISocialTweetList, ISocialTweetsAndColumnsResponse } from "./social"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_TWEETS = "scremsong/triage/LOAD_TWEETS"

const initialState: IModule = {
    columns: [],
    column_tweets: {},
}

// Reducer
type IAction = IActionLoadTweets | IActionsTweetsFetch | IActionTweetsNew | IActionSocialColumnsList
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_LOAD_TWEETS:
            action.columns.forEach((column: ITweetFetchColumn, index: number) => {
                // Merge and then sort column tweetIds to maintain the correct order chronological order
                const val = uniq([...state.column_tweets![column.id], ...column.tweet_ids])
                const sorted = val.sort().reverse()
                state = dotProp.set(state, `column_tweets.${column.id}`, sorted)
            })
            return state
        case WS_TWEETS_NEW_TWEET:
            action.columnIds.forEach((columnId: number) => {
                // Merge and then sort column tweetIds to maintain the correct order chronological order
                const val = uniq([...state.column_tweets![columnId], ...[action.tweet.data.id_str]])
                const sorted = val.sort().reverse()
                state = dotProp.set(state, `column_tweets.${columnId}`, sorted)

                const columnIndex = state.columns.findIndex((c: ITriageColumn) => c.id === columnId)
                const totalTweets = dotProp.get(state, `columns.${columnIndex}.total_tweets`)
                state = dotProp.set(state, `columns.${columnIndex}.total_tweets`, totalTweets + 1)
            })
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
            return dotProp.set(state, "columns", action.columns)
        default:
            return state
    }
}

// Action Creators
export const loadTweets = (json: ISocialTweetsAndColumnsResponse): IActionLoadTweets => ({
    type: LOAD_TWEETS,
    ...json,
})

// Models
export interface IModule {
    columns: ITriageColumn[]
    column_tweets: ITriageColumnTweets
}

export interface IActionLoadTweets extends Action<typeof LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {
    columns: ITweetFetchColumn[]
    tweets: ISocialTweetList
}

export enum eSocialPlatformChoice {
    TWITTER = "SocialPlatformChoice.TWITTER",
}

export interface ITriageColumn {
    id: number
    platform: eSocialPlatformChoice
    search_phrases: string[]
    total_tweets: number
}

export interface ITriageColumnTweets {
    [key: number]: string[]
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
