import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { ISocialTweet } from "../../redux/modules/social"
import TweetColumnReplier from "./TweetColumnReplier"

export interface IProps {
    open: boolean
    tweetId: string
    onCloseReplier: any
}

export interface IStoreProps {
    tweet: ISocialTweet
}

export interface IDispatchProps {
    onTweetCharacterLimitError: Function
    onTweetCharacterLimitValid: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnReplierContainer extends React.Component<TComponentProps, {}> {
    public constructor(props: TComponentProps) {
        super(props)
    }

    public render() {
        const { open, tweet, onCloseReplier, onTweetCharacterLimitError, onTweetCharacterLimitValid } = this.props

        if (tweet === undefined || open === false) {
            return null
        }

        return (
            <TweetColumnReplier
                open={open}
                tweet={tweet}
                onCloseReplier={onCloseReplier}
                onTweetCharacterLimitError={onTweetCharacterLimitError}
                onTweetCharacterLimitValid={onTweetCharacterLimitValid}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { social } = state

    return {
        tweet: social.tweets[ownProps.tweetId],
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onTweetCharacterLimitError: () => {
            console.log("onTweetCharacterLimitError")
        },
        onTweetCharacterLimitValid: () => {
            console.log("onTweetCharacterLimitValid")
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnReplierContainer)
