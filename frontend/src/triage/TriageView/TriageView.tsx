import * as React from "react"
import Tweet from "react-tweet"
import styled from "styled-components"

const ThinTweet = styled(Tweet)`
    max-width: 110px !important;
`

export interface IProps {
    tweets: object[]
}

export class TriageView extends React.Component<IProps, {}> {
    public render() {
        const { tweets } = this.props
        console.log("tweets", tweets)

        const linkProps = { target: "_blank", rel: "noreferrer" }

        return (
            <React.Fragment>
                {tweets.map((tweet: any, key: number) => {
                    return <ThinTweet key={tweet.tweet_id} data={tweet.data} linkProps={linkProps} />
                })}
            </React.Fragment>
        )
    }
}

export default TriageView
