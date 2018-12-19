import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import {
    dismissTweet,
    fetchTweets,
    getTweetAssignmentsForColumn,
    ISocialTweetAssignments,
    ISocialTweetList,
} from "../../redux/modules/social"
import { ITriageColumn } from "../../redux/modules/triage"
import TweetColumn from "./TweetColumn"

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
    onDismissTweet: any
}

export interface IReactVirtualizedIndexes {
    startIndex: number
    stopIndex: number
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnContainer extends React.Component<TComponentProps, {}> {
    private loadMoreRows: any

    public constructor(props: TComponentProps) {
        super(props)

        this.loadMoreRows = (indexes: IReactVirtualizedIndexes) => props.loadMoreRows(this.props.column, indexes)
    }
    public render() {
        const { column, onOpenAssigner, tweet_ids, tweets, tweet_assignments, assignments, onDismissTweet } = this.props

        return (
            <TweetColumn
                column={column}
                onOpenAssigner={onOpenAssigner}
                tweet_ids={tweet_ids}
                tweets={tweets}
                tweet_assignments={tweet_assignments}
                assignments={assignments}
                loadMoreRows={this.loadMoreRows}
                onDismissTweet={onDismissTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { triage, social, reviewers } = state

    const getTweetAssignmentsForColumnFilter = getTweetAssignmentsForColumn(state)

    return {
        tweet_ids: triage.column_tweets[ownProps.column.id],
        tweets: social.tweets, // No need to have a selector here as shouldComponentUpdate in TweetColumn ignores changes to tweets
        tweet_assignments: getTweetAssignmentsForColumnFilter(triage.column_tweets[ownProps.column.id]),
        assignments: reviewers.assignments,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        loadMoreRows: (column: ITriageColumn, indexes: IReactVirtualizedIndexes) => {
            return dispatch(fetchTweets(indexes.startIndex, indexes.stopIndex, [column.id]))
        },
        onDismissTweet: (tweetId: string) => {
            dispatch(dismissTweet(tweetId))
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnContainer)
