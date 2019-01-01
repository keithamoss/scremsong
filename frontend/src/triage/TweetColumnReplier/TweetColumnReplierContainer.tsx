import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { ISocialPrecannedTweetReplies, ISocialTweet, replyToTweet } from "../../redux/modules/social"
import TweetColumnReplier from "./TweetColumnReplier"

export interface IProps {
    open: boolean
    tweetId: string
    onCloseReplier: any
}

export interface IStoreProps {
    tweet: ISocialTweet
    precanned_replies: ISocialPrecannedTweetReplies
}

export interface IDispatchProps {
    onReply: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnReplierContainer extends React.Component<TComponentProps, {}> {
    public render() {
        const { open, tweet, precanned_replies, onCloseReplier, onReply } = this.props

        if (tweet === undefined || open === false) {
            return null
        }

        return (
            <TweetColumnReplier
                open={open}
                tweet={tweet}
                precanned_replies={precanned_replies}
                onCloseReplier={onCloseReplier}
                onReply={onReply}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { social } = state

    return {
        tweet: social.tweets[ownProps.tweetId],
        precanned_replies: social.precanned_replies,
    }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
    return {
        onReply: async (inReplyToTweetId: string, replyText: string) => {
            const success = await dispatch(replyToTweet(inReplyToTweetId, replyText))
            if (success === true) {
                ownProps.onCloseReplier()
            }
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnReplierContainer)
