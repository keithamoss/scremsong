import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { ISocialPrecannedTweetReplies, ISocialTweet } from "../../redux/modules/social"
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
    onFieldInvalid: Function
    onFieldValid: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnReplierContainer extends React.Component<TComponentProps, {}> {
    public constructor(props: TComponentProps) {
        super(props)
    }

    public render() {
        const { open, tweet, precanned_replies, onCloseReplier, onFieldInvalid, onFieldValid } = this.props

        if (tweet === undefined || open === false) {
            return null
        }

        return (
            <TweetColumnReplier
                open={open}
                tweet={tweet}
                precanned_replies={precanned_replies}
                onCloseReplier={onCloseReplier}
                onFieldInvalid={onFieldInvalid}
                onFieldValid={onFieldValid}
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

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onFieldInvalid: () => {
            console.log("onFieldInvalid")
        },
        onFieldValid: () => {
            console.log("onFieldValid")
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnReplierContainer)
