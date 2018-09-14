import * as React from "react"
import { connect } from "react-redux"
import { fetchTweets } from "src/redux/modules/app"
import { IStore } from "src/redux/modules/interfaces"
import TweetColumn from "./TweetColumn"

export interface IProps {
    column: any
}

export interface IStoreProps {
    tweet_ids: string[]
    tweets: any[]
}

export interface IDispatchProps {
    loadMoreRows: any
    assignTweet: any
    dismissTweet: any
}

export class TweetColumnContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    private loadMoreRows: any
    private assignTweet: any
    private dismissTweet: any

    public constructor(props: any) {
        super(props)

        this.loadMoreRows = props.loadMoreRows.bind(this, props.column)
        this.assignTweet = props.assignTweet.bind(this, props.tweets)
        this.dismissTweet = props.dismissTweet.bind(this, props.tweets)
    }
    public render() {
        const { column, tweet_ids, tweets } = this.props

        return (
            <TweetColumn
                column={column}
                tweet_ids={tweet_ids}
                tweets={tweets}
                loadMoreRows={this.loadMoreRows}
                assignTweet={this.assignTweet}
                dismissTweet={this.dismissTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { app } = state

    return {
        tweet_ids: app.column_tweets[ownProps.column.id],
        tweets: app.tweets,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        loadMoreRows: (column: any, indexes: { startIndex: number; stopIndex: number }) => {
            return dispatch(fetchTweets(indexes.startIndex, indexes.stopIndex, [column.id]))
        },
        assignTweet: (tweets: any[], tweetId: string, event: any) => {
            console.log("assignTweet", tweetId, tweets[tweetId])
        },
        dismissTweet: (tweets: any[], tweetId: string, event: any) => {
            console.log("dismissTweet", tweetId, tweets[tweetId])
        },
    }
}

const TweetColumnContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnContainer)

export default TweetColumnContainerWrapped
