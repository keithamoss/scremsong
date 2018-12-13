import * as dotProp from "dot-prop-immutable"
import { WS_REVIEWERS_LIST_ASSIGNMENTS, WS_TWEETS_FETCH_SOME, WS_TWEETS_FETCH_SOME_NEW_TWEETS } from "src/websockets/constants"
import { IThunkExtras } from "../../redux/modules/interfaces"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_TWEETS = "scremsong/tweets/LOAD_TWEETS"
const DISMISS = "scremsong/tweets/DISMISS"

const initialState: IModule = {
    tweets: [],
}

// Reducer
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_FETCH_SOME:
        case WS_TWEETS_FETCH_SOME_NEW_TWEETS:
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            // console.log("social.WS_TWEETS_FETCH_SOME_NEW_TWEETS or social.WS_TWEETS_FETCH_SOME or social.LOAD_TWEETS", action)
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case DISMISS:
            return dotProp.set(state, `tweets.${action.tweetId}.is_dismissed`, true)
        default:
            return state
    }
}

// Action Creators
export function loadTweets(tweets: object[]) {
    return {
        type: LOAD_TWEETS,
        tweets,
    }
}

export function dismissTweet(tweetId: string) {
    return {
        type: DISMISS,
        tweetId,
    }
}

// Models
export interface IModule {
    tweets: object[]
}

export interface IAction {
    type: string
    tweets?: object[]
    tweetId?: string
    // columns?: any[]
    // column_tweets?: any
    meta?: {
        // analytics: IAnalyticsMeta
    }
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera

export function fetchTweets(startIndex: number, stopIndex: number, columns: any[] = []) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        const { json } = await api.get(
            "/api/0.1/tweets/get_some_tweets/",
            dispatch,
            {
                startIndex,
                stopIndex,
                columns: columns.join(","),
            },
            true
        )
        await dispatch(loadTweets(json))
    }
}

export function dismissATweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        dispatch(dismissTweet(tweetId))
        await api.get("/api/0.1/tweets/dismiss/", dispatch, {
            tweetId,
        })
    }
}
