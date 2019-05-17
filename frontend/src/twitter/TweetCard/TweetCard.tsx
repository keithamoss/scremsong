import * as React from "react"
import Tweet from "react-tweet"
import { eSocialTweetActionType, ISocialTweet, ISocialTweetData } from "../../redux/modules/social"
import TweetColumnReplierContainer from "../../triage/TweetColumnReplier/TweetColumnReplierContainer"

export interface IProps {
    tweet: ISocialTweet
    tweetStyles?: React.CSSProperties
    onTweetAction: any
    muzzled: boolean
    onMediaLoad?: any
    onMediaLoadError?: any
}

export interface IState {
    replierOpen: boolean
}

type TComponentProps = IProps
class TweetCard extends React.PureComponent<TComponentProps, IState> {
    private onTweetAction: any
    private onCloseReplier: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { replierOpen: false }

        this.onTweetAction = (tweetAction: eSocialTweetActionType, tweet: ISocialTweetData) => {
            if (tweetAction === eSocialTweetActionType.REPLY) {
                this.setState({ replierOpen: true })
            } else {
                this.props.onTweetAction(tweetAction, tweet)
            }
        }
        this.onCloseReplier = () => {
            this.setState({ replierOpen: false })
        }
    }

    // public componentDidUpdate(prevProps: TComponentProps) {
    //     this.onTweetAction = (tweetAction: eSocialTweetActionType, tweet: ISocialTweetData) => {x
    //         if (tweetAction === eSocialTweetActionType.REPLY) {
    //             this.setState({ replierOpen: true })
    //         } else {
    //             this.props.onTweetAction(tweetAction, tweet)
    //         }
    //     }
    // }

    public render() {
        const { tweet, muzzled, tweetStyles, onMediaLoad, onMediaLoadError } = this.props
        const { replierOpen } = this.state

        return (
            <React.Fragment>
                <TweetColumnReplierContainer open={replierOpen} tweetId={tweet.data.id_str} onCloseReplier={this.onCloseReplier} />
                <Tweet
                    data={JSON.parse(JSON.stringify(tweet.data))}
                    linkProps={{ target: "_blank", rel: "noreferrer" }}
                    tweetStyles={tweetStyles}
                    onTweetAction={muzzled === false ? this.onTweetAction : undefined}
                    onMediaLoad={onMediaLoad}
                    onMediaLoadError={onMediaLoadError}
                />
            </React.Fragment>
        )
    }
}

export default TweetCard
