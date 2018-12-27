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

// @FIXME Use props in Material UI style when that ships
const getColurForDepth = (depth: number) => {
    switch (depth) {
        case 0:
            return "lightgrey"
        case 1:
            return "rgb(160, 0, 67)" // dark red
        case 2:
            return "rgb(214, 62, 81)" // bright red
        case 3:
            return "rgb(245, 108, 66)" // orange
        case 4:
            return "rgb(252, 173, 98)" // bright orange
        case 5:
            return "rgb(255, 224, 139)" // orangey yellow
        case 6:
            return "rgb(232, 246, 152)" // pale yellow
        case 7:
            return "rgb(171, 222, 163)" // pale green
        case 8:
            return "rgb(105, 194, 166)" // green
        case 9:
            return "rgb(53, 135, 189)" // blue
        default:
            return "rgb(95, 79, 162)" // purple
    }
}
const getBorderCSSForDepth = (depth: number) => {
    return depth > 0 ? `6px solid ${getColurForDepth(depth)}` : "0px"
}

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
                    <div style={{ marginLeft: ourDepth * 6, borderLeft: getBorderCSSForDepth(ourDepth) }}>
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
