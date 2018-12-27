import { debounce } from "lodash-es"
import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import {
    eSocialTweetState,
    fetchTweets,
    getTweetAssignmentsForColumn,
    ISocialTweetAssignments,
    ISocialTweetList,
    setTweetState,
} from "../../redux/modules/social"
import { ITriageColumn } from "../../redux/modules/triage"
import { IProfileColumnPosition, ws_changeUserProfileSettings } from "../../redux/modules/user"
import TweetColumn from "./TweetColumn"

// Ref. https://github.com/bvaughn/react-virtualized/blob/master/docs/InfiniteLoader.md
const preFetchThreshold = 5
const minBatchSize = 20
const overscanRowCount = 1

export interface IProps {
    column: ITriageColumn
    onOpenAssigner: any
}

export interface IStoreProps {
    tweet_ids: string[]
    tweets: ISocialTweetList
    tweet_assignments: ISocialTweetAssignments
    assignments: IReviewerAssignment[]
}

export interface IDispatchProps {
    loadMoreRows: any
    onPositionUpdate: any
    onSetTweetState: any
}

export interface IReactVirtualizedIndexes {
    startIndex: number
    stopIndex: number
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnContainer extends React.Component<TComponentProps, {}> {
    private loadMoreRows: any
    private onPositionUpdate: any

    public constructor(props: TComponentProps) {
        super(props)

        this.loadMoreRows = (indexes: IReactVirtualizedIndexes) => props.loadMoreRows(this.props.column, indexes)
        this.onPositionUpdate = debounce(
            (columnId: number, opts: any /*ListProps["onRowsRendered"]*/) =>
                this.props.onPositionUpdate(columnId, {
                    firstTweet: this.props.tweet_ids[0],
                    firstVisibleTweet: this.props.tweet_ids[opts.startIndex],
                    stopTweet:
                        this.props.tweet_ids[opts.overscanStopIndex + minBatchSize / 2] ||
                        this.props.tweet_ids[this.props.tweet_ids.length - 1],
                }),
            2500,
            { maxWait: 5000 }
        )
    }
    public render() {
        const { column, onOpenAssigner, tweet_ids, tweets, tweet_assignments, assignments, onSetTweetState } = this.props

        return (
            <TweetColumn
                column={column}
                onOpenAssigner={onOpenAssigner}
                tweet_ids={tweet_ids}
                tweets={tweets}
                tweet_assignments={tweet_assignments}
                assignments={assignments}
                preFetchThreshold={preFetchThreshold}
                minBatchSize={minBatchSize}
                overscanRowCount={overscanRowCount}
                loadMoreRows={this.loadMoreRows}
                onPositionUpdate={this.onPositionUpdate}
                onSetTweetState={onSetTweetState}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { triage, social, reviewers } = state

    const getTweetAssignmentsForColumnFilter = getTweetAssignmentsForColumn(state)

    return {
        tweet_ids: triage.column_tweets[ownProps.column.id],
        tweets: social.tweets, // No need to have a selector here as shouldComponentUpdate in TweetColumn re-renders all changes to tweets
        tweet_assignments: getTweetAssignmentsForColumnFilter(triage.column_tweets[ownProps.column.id]),
        assignments: reviewers.assignments,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        loadMoreRows: (column: ITriageColumn, indexes: IReactVirtualizedIndexes) => {
            return dispatch(fetchTweets(indexes.startIndex, indexes.stopIndex, [column.id]))
        },
        onPositionUpdate: (columnId: number, positions: IProfileColumnPosition) => {
            const settings = { column_positions: {} }
            settings.column_positions[columnId] = positions
            dispatch(ws_changeUserProfileSettings(settings))
        },
        onSetTweetState: (tweetId: string, tweetState: eSocialTweetState) => {
            dispatch(setTweetState(tweetId, tweetState))
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnContainer)
