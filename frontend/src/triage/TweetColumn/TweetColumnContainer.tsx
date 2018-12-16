import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerAssignment, IReviewerUser } from "../../redux/modules/reviewers"
import { dismissTweet, fetchTweets, ISocialTweetAssignments, ISocialTweetList } from "../../redux/modules/social"
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
    reviewers: IReviewerUser[]
    assignments: IReviewerAssignment[]
}

export interface IDispatchProps {
    loadMoreRows: any
    onDismissTweet: any
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
export class TweetColumnContainer extends React.Component<TComponentProps, {}> {
    private loadMoreRows: any

    public constructor(props: TComponentProps) {
        super(props)

        this.loadMoreRows = props.loadMoreRows.bind(this, props.column)
    }
    public render() {
        const { column, onOpenAssigner, tweet_ids, tweets, tweet_assignments, reviewers, assignments, onDismissTweet } = this.props

        return (
            <TweetColumn
                column={column}
                onOpenAssigner={onOpenAssigner}
                tweet_ids={tweet_ids}
                tweets={tweets}
                tweet_assignments={tweet_assignments}
                reviewers={reviewers}
                assignments={assignments}
                loadMoreRows={this.loadMoreRows}
                onDismissTweet={onDismissTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { triage, social, reviewers } = state

    return {
        tweet_ids: triage.column_tweets[ownProps.column.id],
        tweets: social.tweets,
        tweet_assignments: social.tweet_assignments,
        reviewers: reviewers.users,
        assignments: reviewers.assignments,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        loadMoreRows: (column: ITriageColumn, indexes: { startIndex: number; stopIndex: number }) => {
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
