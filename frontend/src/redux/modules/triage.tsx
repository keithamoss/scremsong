import * as dotProp from "dot-prop-immutable"
import { uniq } from "lodash-es"
import { IActionSocialColumnsList, IActionsTweetsFetch, IActionTweetsNew, ITweetFetchColumn } from "../../websockets/actions"
import { WS_SOCIAL_COLUMNS_LIST, WS_TWEETS_FETCH_SOME, WS_TWEETS_NEW } from "../../websockets/constants"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
// const LOAD_TWEETS = "ealgis/app/LOAD_TWEETS"
// const LOAD_NEW_TWEETS = "ealgis/app/LOAD_NEW_TWEETS"
// const DISMISS_TWEET = "ealgis/app/DISMISS_TWEET"
// const LOAD_COLUMNS = "ealgis/app/LOAD_COLUMNS"

const initialState: IModule = {
    columns: [],
    column_tweets: {},
}

// Reducer
type IAction = IActionsTweetsFetch | IActionTweetsNew | IActionSocialColumnsList
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case WS_TWEETS_FETCH_SOME:
            action.columns.forEach((column: ITweetFetchColumn, index: number) => {
                // Merge and then sort column tweetIds to maintain the correct order chronological order
                const val = uniq([...state.column_tweets![column.id], ...column.tweet_ids])
                const sorted = val.sort().reverse()
                state = dotProp.set(state, `column_tweets.${column.id}`, sorted)
            })
            return state
        case WS_TWEETS_NEW:
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
        // case WS_TWEETS_FETCH_SOME_NEW_TWEETS:
        //     console.log("triage.WS_TWEETS_FETCH_SOME_NEW_TWEETS", action)
        //     action.columns.forEach((column: ITriageColumn, index: number) => {
        //         // Merge and then sort column tweetIds to maintain the correct order chronological order
        //         const val = uniq([...state.column_tweets![column.id], ...column.tweets])
        //         const sorted = val.sort().reverse()
        //         state = dotProp.set(state, `column_tweets.${column.id}`, sorted)

        //         // Update the total number of tweets in the database for this column
        //         const columnIndex = state.columns.findIndex((col: ITriageColumn) => {
        //             return col.id === column.id
        //         })
        //         state = dotProp.set(
        //             state,
        //             `columns.${columnIndex}.total_tweets`,
        //             state.columns[columnIndex].total_tweets + column.tweets.length
        //         )
        //     })
        //     return state
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

// Models
export interface IModule {
    columns: ITriageColumn[]
    column_tweets: ITriageColumnTweets
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
