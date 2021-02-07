import * as React from 'react'
import { connect } from 'react-redux'
import { getTwitterSettings } from '../../redux/modules/app'
import { IStore } from '../../redux/modules/reducer'
import {
  ESocialTweetActionType,
  favouriteTweet,
  ISocialTweet,
  ISocialTweetData,
  retweetTweet,
  unfavouriteTweet,
  unretweetTweet,
} from '../../redux/modules/social'
import TweetCard from './TweetCard'

export interface IProps {
  tweetId: string
  tweetStyles?: React.CSSProperties
  onMediaLoad?: any
  onMediaLoadError?: any
}

export interface IStoreProps {
  tweet: ISocialTweet
  muzzled: boolean
}

export interface IDispatchProps {
  onTweetAction: any
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetCardContainer extends React.PureComponent<TComponentProps, {}> {
  public render() {
    const { tweet, muzzled, tweetStyles, onTweetAction, onMediaLoad, onMediaLoadError } = this.props

    return (
      <TweetCard
        tweet={tweet}
        tweetStyles={tweetStyles}
        onTweetAction={onTweetAction}
        muzzled={muzzled}
        onMediaLoad={onMediaLoad}
        onMediaLoadError={onMediaLoadError}
      />
    )
  }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
  const { social } = state

  const twitterSettings = getTwitterSettings(state)

  return {
    tweet: social.tweets[ownProps.tweetId],
    // @TODO Clean up
    // eslint-disable-next-line no-unneeded-ternary
    muzzled: 'muzzled' in twitterSettings && twitterSettings.muzzled === true ? true : false,
  }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
  return {
    onTweetAction: (tweetAction: ESocialTweetActionType, tweet: ISocialTweetData) => {
      if (tweetAction === ESocialTweetActionType.FAVOURITE) {
        if (tweet.favorited === false) {
          dispatch(favouriteTweet(tweet.id_str))
        } else {
          dispatch(unfavouriteTweet(tweet.id_str))
        }
      } else if (tweetAction === ESocialTweetActionType.RETWEET) {
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
