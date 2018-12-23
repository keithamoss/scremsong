import * as React from "react"
import Tweet from "react-tweet"
import { IReviewerAssignmentThreadRelationships } from "../../redux/modules/reviewers"
import { ISocialTweetList } from "../../redux/modules/social"

export interface IProps {
    tweetId: string
    threadRelationships: IReviewerAssignmentThreadRelationships[]
    tweets: ISocialTweetList
    depth?: number
}

export interface IState {}

type TComponentProps = IProps
class TweetThread extends React.PureComponent<TComponentProps, IState> {
    public render() {
        const { tweetId, threadRelationships, tweets, depth } = this.props

        const ourDepth = depth === undefined ? 0 : depth
        const nextDepth = ourDepth + 1

        let childTweetIds: string[] = []
        if (threadRelationships.length > 0) {
            childTweetIds = threadRelationships
                .filter((relationship: IReviewerAssignmentThreadRelationships) => Object.values(relationship)[0] === tweetId)
                .map((relationship: IReviewerAssignmentThreadRelationships) => Object.keys(relationship)[0])
        }

        return (
            <React.Fragment>
                {ourDepth === 0 && childTweetIds.length === 0 && (
                    <Tweet data={tweets[tweetId].data} linkProps={{ target: "_blank", rel: "noreferrer" }} />
                )}
                {!(ourDepth === 0 && childTweetIds.length === 0) && (
                    <div style={{ marginLeft: ourDepth * 10, borderLeft: "6px solid lightgrey" }}>
                        <Tweet data={tweets[tweetId].data} linkProps={{ target: "_blank", rel: "noreferrer" }} />
                    </div>
                )}

                {childTweetIds.length > 0 &&
                    childTweetIds.map((childTweetId: string) => (
                        <TweetThread
                            key={childTweetId}
                            tweetId={childTweetId}
                            threadRelationships={threadRelationships}
                            tweets={tweets}
                            depth={nextDepth}
                        />
                    ))}
            </React.Fragment>
        )
    }
}

export default TweetThread
