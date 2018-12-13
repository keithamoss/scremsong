import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "src/redux/modules/interfaces"
import { assignAReviewer, IReviewerUser, unassignAReviewer } from "src/redux/modules/reviewers"
import { dismissATweet, fetchTweets } from "src/redux/modules/social"
import TweetColumn from "./TweetColumn"

export interface IProps {
    column: any
}

export interface IStoreProps {
    tweet_ids: string[]
    tweets: any[]
    reviewers: IReviewerUser[]
}

export interface IDispatchProps {
    loadMoreRows: any
    assignTweet: any
    dismissTweet: any
}

export class TweetColumnContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    private loadMoreRows: any

    public constructor(props: any) {
        super(props)

        this.loadMoreRows = props.loadMoreRows.bind(this, props.column)
    }
    public render() {
        const { column, tweet_ids, tweets, reviewers, assignTweet, dismissTweet } = this.props

        return (
            <TweetColumn
                column={column}
                tweet_ids={tweet_ids}
                tweets={tweets}
                reviewers={reviewers}
                loadMoreRows={this.loadMoreRows}
                assignTweet={assignTweet}
                dismissTweet={dismissTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { triage, social, reviewers } = state

    return {
        tweet_ids: triage.column_tweets[ownProps.column.id],
        tweets: social.tweets,
        reviewers: reviewers.users,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        loadMoreRows: (column: any, indexes: { startIndex: number; stopIndex: number }) => {
            return dispatch(fetchTweets(indexes.startIndex, indexes.stopIndex, [column.id]))
        },
        assignTweet: (event: any, item: any) => {
            if ("data-reviewerid" in item.props) {
                dispatch(assignAReviewer(item.props["data-tweetid"], item.props["data-reviewerid"]))
            } else {
                dispatch(unassignAReviewer(item.props["data-tweetid"]))
            }
        },
        dismissTweet: (tweetId: string, event: any) => {
            dispatch(dismissATweet(tweetId))
        },
    }
}

const TweetColumnContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnContainer)

export default TweetColumnContainerWrapped
