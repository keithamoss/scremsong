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
    // onAssignTweet: Function
    // onUnassignTweet: Function
    // onReassign: Function
    // onBulkReassign: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnReplierContainer extends React.Component<TComponentProps, {}> {
    public constructor(props: TComponentProps) {
        super(props)
    }

    public render() {
        const { open, tweet, onCloseReplier } = this.props

        return <TweetColumnReplier open={open} tweet={tweet} onCloseReplier={onCloseReplier} />
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
        // onAssignTweet: (tweetId: string, userId: number) => {
        //     dispatch(assignReviewer(tweetId, userId))
        // },
        // onUnassignTweet: (assignment: IReviewerAssignment) => {
        //     dispatch(unassignReviewer(assignment.id))
        // },
        // onReassign: (assignmentId: number, newReviewerId: number) => {
        //     dispatch(reassignReviewer(assignmentId, newReviewerId))
        // },
        // onBulkReassign: (currentReviewerId: number, newReviewerId: number) => {
        //     dispatch(bulkReassignReviewer(currentReviewerId, newReviewerId))
        // },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnReplierContainer)
