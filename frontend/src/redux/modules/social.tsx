import * as dotProp from "dot-prop-immutable"
import { Action } from "redux"
import { IActionReviewersListAssignments, IActionsTweetsFetch } from "src/websockets/actions"
import { WS_REVIEWERS_LIST_ASSIGNMENTS, WS_TWEETS_FETCH_SOME } from "src/websockets/constants"
import { IThunkExtras } from "../../redux/modules/interfaces"
import { eSocialAssignmentStatus } from "./reviewers"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"

// Actions
const LOAD_TWEETS = "scremsong/tweets/LOAD_TWEETS"
const DISMISS = "scremsong/tweets/DISMISS"

const initialState: IModule = {
    tweets: [],
}

// Reducer
type IAction = IActionDismissTweet | IActionLoadTweets | IActionsTweetsFetch | IActionReviewersListAssignments
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_FETCH_SOME:
        // case WS_TWEETS_FETCH_SOME_NEW_TWEETS:
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
export const loadTweets = (tweets: ISocialTweetList): IActionLoadTweets => ({
    type: LOAD_TWEETS,
    tweets,
})

export const dismissTweet = (tweetId: string): IActionDismissTweet => ({
    type: DISMISS,
    tweetId,
})

// Models
export interface IModule {
    tweets: ISocialTweet[]
}

export interface IActionLoadTweets extends Action<typeof LOAD_TWEETS> {
    tweets: ISocialTweetList
}

export interface IActionDismissTweet extends Action<typeof DISMISS> {
    tweetId: string
}

export interface ISocialTweetList {
    [key: string]: ISocialTweet
}

export interface ISocialTweet {
    id: number
    data: ISocialTweetData
    is_dismissed: boolean
    review_status?: eSocialAssignmentStatus
    reviewer_id?: number
}

export interface ISocialTweetData {}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchTweets(startIndex: number, stopIndex: number, columns: number[] = []) {
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
