import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    eSocialTweetActionType,
    favouriteTweet,
    ISocialTweet,
    ISocialTweetData,
    retweetTweet,
    unfavouriteTweet,
    unretweetTweet,
} from "../../redux/modules/social"
import TweetCard from "./TweetCard"

export interface IProps {
    tweetId: string
    tweetStyles?: React.CSSProperties
    onMediaLoad?: any
    onMediaLoadError?: any
}

export interface IStoreProps {
    tweet: ISocialTweet
}

export interface IDispatchProps {
    onTweetAction: any
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetCardContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { tweet, tweetStyles, onTweetAction, onMediaLoad, onMediaLoadError } = this.props

        return (
            <TweetCard
                tweet={tweet}
                tweetStyles={tweetStyles}
                onTweetAction={onTweetAction}
                onMediaLoad={onMediaLoad}
                onMediaLoadError={onMediaLoadError}
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
        onTweetAction: (tweetAction: eSocialTweetActionType, tweet: ISocialTweetData) => {
            if (tweetAction === eSocialTweetActionType.FAVOURITE) {
                if (tweet.favorited === false) {
                    dispatch(favouriteTweet(tweet.id_str))
                } else {
                    dispatch(unfavouriteTweet(tweet.id_str))
                }
            } else if (tweetAction === eSocialTweetActionType.RETWEET) {
                if (tweet.retweeted === false) {
                    dispatch(retweetTweet(tweet.id_str))
                } else {
                    dispatch(unretweetTweet(tweet.id_str))
                }
            }
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetCardContainer)
