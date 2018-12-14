import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "src/redux/modules/interfaces"
import { assignReviewer, IReviewerAssignment, IReviewerUser, unassignReviewer } from "src/redux/modules/reviewers"
import { dismissATweet, fetchTweets, ISocialTweetAssignments, ISocialTweetList } from "src/redux/modules/social"
import { ITriageColumn } from "src/redux/modules/triage"
import TweetColumn from "./TweetColumn"

export interface IProps {
    column: ITriageColumn
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
    assignOrUnassignTweet: any
    dismissTweet: any
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
export class TweetColumnContainer extends React.Component<TComponentProps, {}> {
    private loadMoreRows: any

    public constructor(props: TComponentProps) {
        super(props)

        this.loadMoreRows = props.loadMoreRows.bind(this, props.column)
    }
    public render() {
        const { column, tweet_ids, tweets, tweet_assignments, reviewers, assignments, assignOrUnassignTweet, dismissTweet } = this.props

        return (
            <TweetColumn
                column={column}
                tweet_ids={tweet_ids}
                tweets={tweets}
                tweet_assignments={tweet_assignments}
                reviewers={reviewers}
                assignments={assignments}
                loadMoreRows={this.loadMoreRows}
                assignOrUnassignTweet={assignOrUnassignTweet}
                dismissTweet={dismissTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
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
        assignOrUnassignTweet: (event: any, item: any) => {
            if ("data-reviewerid" in item.props) {
                dispatch(assignReviewer(item.props["data-tweetid"], item.props["data-reviewerid"]))
            } else if ("data-assignmentid" in item.props) {
                dispatch(unassignReviewer(item.props["data-assignmentid"]))
            }
        },
        dismissTweet: (tweetId: string, event: any) => {
            console.log("dismissTweet.event", event)
            dispatch(dismissATweet(tweetId))
        },
    }
}

const TweetColumnContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnContainer)

export default TweetColumnContainerWrapped
