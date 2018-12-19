import * as dotProp from "dot-prop-immutable"
import { memoize } from "lodash-es"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"
import { Action } from "redux"
import { createSelector } from "reselect"
import { IThunkExtras } from "../../redux/modules/interfaces"
import {
    IActionReviewersAssign,
    IActionReviewersListAssignments,
    IActionReviewersUnassign,
    IActionsTweetsDismiss,
    IActionsTweetsFetch,
    IActionTweetsNew,
    ITweetFetchColumn,
} from "../../websockets/actions"
import {
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_UNASSIGN,
    WS_TWEETS_DISMISS,
    WS_TWEETS_LOAD_TWEETS,
    WS_TWEETS_NEW_TWEET,
} from "../../websockets/constants"
import { IStore } from "./reducer"
import { IReviewerAssignment } from "./reviewers"
import { loadTweets as triageLoadTweets } from "./triage"

// Actions
const LOAD_TWEETS = "scremsong/social/LOAD_TWEETS"

const initialState: IModule = {
    tweets: {},
    tweet_assignments: {},
}

// Reducer
type IAction =
    | IActionLoadTweets
    | IActionsTweetsFetch
    | IActionTweetsNew
    | IActionReviewersListAssignments
    | IActionReviewersAssign
    | IActionReviewersUnassign
    | IActionsTweetsDismiss
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_LOAD_TWEETS:
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_TWEETS_NEW_TWEET:
            return dotProp.set(state, `tweets.${action.tweet.data.id_str}`, action.tweet)
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            Object.values(action.assignments).forEach((assignment: IReviewerAssignment, index: number) => {
                state = dotProp.set(state, `tweet_assignments.${assignment.social_id}`, assignment.id)
            })
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_REVIEWERS_ASSIGN:
            return dotProp.set(state, `tweet_assignments.${action.assignment.social_id}`, action.assignment.id)
        case WS_REVIEWERS_UNASSIGN:
            for (const [tweetId, assignmentId] of Object.entries(state.tweet_assignments)) {
                if (assignmentId === action.assignmentId) {
                    state = dotProp.delete(state, `tweet_assignments.${tweetId}`)
                }
            }
            return state
        case WS_TWEETS_DISMISS:
            return dotProp.set(state, `tweets.${action.tweetId}.is_dismissed`, true)
        default:
            return state
    }
}

// Selectors

const getTweetAssignments = (state: IStore) => state.social.tweet_assignments
const getTweets = (state: IStore) => state.social.tweets

export const getTweetIdsForAssignement = createSelector(
    [getTweetAssignments, getTweets],
    (tweetAssignments, tweets) =>
        memoize((assignment: IReviewerAssignment) => {
            const tweetIds: string[] = []
            for (const [tweetId, assignmentId] of Object.entries(tweetAssignments)) {
                if (assignmentId === assignment.id) {
                    tweetIds.push(tweetId)
                }
            }

            const myTweets: any = {}
            tweetIds.map((tweetId: string) => (myTweets[tweetId] = tweets[tweetId]))
            return myTweets
        })
)

export const getTweetAssignmentsForColumn = createSelector(
    [getTweetAssignments],
    tweetAssignments =>
        memoize((columnTweetIds: string[]) => {
            const columnTweetAssignments = {}
            for (const [tweetId, assignmentId] of Object.entries(tweetAssignments)) {
                if (columnTweetIds.includes(tweetId)) {
                    columnTweetAssignments[tweetId] = assignmentId
                }
            }
            return columnTweetAssignments
        })
)

// Action Creators
export const loadTweets = (json: ISocialTweetsAndColumnsResponse): IActionLoadTweets => ({
    type: LOAD_TWEETS,
    ...json,
})

// Models
export interface IModule {
    tweets: ISocialTweetList
    tweet_assignments: ISocialTweetAssignments
}

export interface IActionLoadTweets extends Action<typeof LOAD_TWEETS>, ISocialTweetsAndColumnsResponse {
    columns: ITweetFetchColumn[]
    tweets: ISocialTweetList
}

export interface ISocialTweetsAndColumnsResponse {
    columns: ITweetFetchColumn[]
    tweets: ISocialTweetList
}

export interface ISocialTweetList {
    [key: string]: ISocialTweet
}

export interface ISocialTweetAssignments {
    [key: string]: number
}

export interface ISocialTweet {
    data: ISocialTweetData
    is_dismissed: boolean
}

export interface ISocialTweetData {
    id_str: string
}

// Side effects, only as applicable
// e.g. thunks, epics, et cetera
export function fetchTweets(startIndex: number, stopIndex: number, columns: number[] = []) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        const { json } = await api.get(
            "/api/0.1/tweets/fetch/",
            dispatch,
            {
                startIndex,
                stopIndex,
                columns: columns.join(","),
            },
            true
        )
        await dispatch(loadTweets(json))
        await dispatch(triageLoadTweets(json))
    }
}

export function dismissTweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/dismiss/", dispatch, {
            tweetId,
        })
    }
}
