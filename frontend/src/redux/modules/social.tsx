import * as dotProp from "dot-prop-immutable"
import { memoize } from "lodash-es"
// import { IAnalyticsMeta } from "../../shared/analytics/GoogleAnalytics"
import { Action } from "redux"
import { createSelector } from "reselect"
import { IThunkExtras } from "../../redux/modules/interfaces"
import {
    IActionReviewersAssign,
    IActionReviewersAssignmentUpdated,
    IActionReviewersBulkAssign,
    IActionReviewersListAssignments,
    IActionReviewersUnassign,
    IActionsTweetsLoadTweets,
    IActionsTweetsPrecannedReplies,
    IActionsTweetsSetState,
    IActionTweetsNew,
    IActionTweetsUpdateTweets,
    ITweetFetchColumn,
} from "../../websockets/actions"
import {
    WS_REVIEWERS_ASSIGN,
    WS_REVIEWERS_ASSIGNMENT_UPDATED,
    WS_REVIEWERS_BULK_ASSIGN,
    WS_REVIEWERS_LIST_ASSIGNMENTS,
    WS_REVIEWERS_UNASSIGN,
    WS_TWEETS_LOAD_TWEETS,
    WS_TWEETS_NEW_TWEETS,
    WS_TWEETS_PRECANNED_REPLIES,
    WS_TWEETS_SET_STATE,
    WS_TWEETS_UPDATE_TWEETS,
} from "../../websockets/constants"
import { IStore } from "./reducer"
import { IReviewerAssignment } from "./reviewers"
import { loadTweets as triageLoadTweets } from "./triage"

// Actions
const LOAD_TWEETS = "scremsong/social/LOAD_TWEETS"

const initialState: IModule = {
    tweets: {},
    tweet_assignments: {},
    precanned_replies: {} as ISocialPrecannedTweetReplies,
}

// Reducer
type IAction =
    | IActionLoadTweets
    | IActionsTweetsLoadTweets
    | IActionTweetsNew
    | IActionTweetsUpdateTweets
    | IActionReviewersListAssignments
    | IActionReviewersAssign
    | IActionReviewersUnassign
    | IActionReviewersBulkAssign
    | IActionReviewersAssignmentUpdated
    | IActionsTweetsSetState
    | IActionsTweetsPrecannedReplies
export default function reducer(state: IModule = initialState, action: IAction) {
    switch (action.type) {
        case LOAD_TWEETS:
        case WS_TWEETS_LOAD_TWEETS:
        case WS_TWEETS_NEW_TWEETS:
        case WS_TWEETS_UPDATE_TWEETS:
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_REVIEWERS_LIST_ASSIGNMENTS:
            Object.values(action.assignments).forEach((assignment: IReviewerAssignment, index: number) => {
                state = dotProp.set(state, `tweet_assignments.${assignment.social_id}`, assignment.id)
                assignment.thread_tweets.forEach(
                    (tweetId: string) => (state = dotProp.set(state, `tweet_assignments.${tweetId}`, assignment.id))
                )
            })
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_REVIEWERS_ASSIGN:
        case WS_REVIEWERS_ASSIGNMENT_UPDATED:
            Object.keys(action.tweets).forEach(
                (tweetId: string) => (state = dotProp.set(state, `tweet_assignments.${tweetId}`, action.assignment.id))
            )
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_REVIEWERS_BULK_ASSIGN:
            action.assignments.forEach((assignment: IReviewerAssignment) => {
                state = dotProp.set(state, `tweet_assignments.${assignment.social_id}`, assignment.id)
                assignment.thread_tweets.forEach(
                    (tweetId: string) => (state = dotProp.set(state, `tweet_assignments.${tweetId}`, assignment.id))
                )
            })
            return dotProp.set(state, "tweets", { ...state.tweets, ...action.tweets })
        case WS_REVIEWERS_UNASSIGN:
            for (const [tweetId, assignmentId] of Object.entries(state.tweet_assignments)) {
                if (assignmentId === action.assignmentId) {
                    state = dotProp.delete(state, `tweet_assignments.${tweetId}`)
                }
            }
            return state
        case WS_TWEETS_SET_STATE:
            return dotProp.set(state, `tweets.${action.tweetId}.state`, action.tweetState)
        case WS_TWEETS_PRECANNED_REPLIES:
            return dotProp.set(state, "precanned_replies", action.replies)
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

export const getTweetsForColumn = createSelector(
    [getTweetAssignments, getTweets],
    (tweetAssignments, tweets) =>
        memoize((columnTweetIds: string[]) => {
            return Object.keys(tweets)
                .filter((tweetId: string) => columnTweetIds.includes(tweetId))
                .reduce((obj, tweetId) => {
                    obj[tweetId] = tweets[tweetId]
                    return obj
                }, {})
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
    precanned_replies: ISocialPrecannedTweetReplies
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

export enum eSocialTweetState {
    ACTIVE = "Active",
    DEALT_WITH = "Dealt With",
    DISMISSED = "Dismissed",
}

export enum eSocialTweetActionType {
    REPLY = "reply",
    RETWEET = "retweet",
    FAVOURITE = "favourite",
}

export interface ISocialTweet {
    data: ISocialTweetData
    state: eSocialTweetState
}

export interface ISocialTweetData {
    id_str: string
    favorited: boolean
    retweeted: boolean
    user: {
        screen_name: string
    }
    entities: {
        user_mentions: ISocialTweetDataUserMention[]
    }
}

export interface ISocialTweetDataUserMention {
    id: number
    name: string
    id_str: string
    indices: number[]
    screen_name: string
}

export enum eSocialTweetReplyCategories {
    POSITIVE_REPORT = "Positive Report",
    NEGATIVE_REPORT = "Negative Report",
    THANK_YOUS = "Thank Yous",
}

export interface ISocialPrecannedTweetReplies {
    eSocialTweetReplyCategories: string[]
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

export function setTweetState(tweetId: string, tweetState: eSocialTweetState) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/set_state/", dispatch, {
            tweetId,
            tweetState,
        })
    }
}

export function favouriteTweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/favourite/", dispatch, {
            tweetId,
        })
    }
}

export function unfavouriteTweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/unfavourite/", dispatch, {
            tweetId,
        })
    }
}

export function retweetTweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/retweet/", dispatch, {
            tweetId,
        })
    }
}

export function unretweetTweet(tweetId: string) {
    return async (dispatch: Function, getState: Function, { api, emit }: IThunkExtras) => {
        await api.get("/api/0.1/tweets/unretweet/", dispatch, {
            tweetId,
        })
    }
}
