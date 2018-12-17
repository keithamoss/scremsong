import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    assignReviewer,
    getUserAssignmentTotals,
    IReviewerAssignment,
    IReviewerAssignmentCounts,
    IReviewerUser,
    unassignReviewer,
} from "../../redux/modules/reviewers"
import TweetColumnAssigner from "./TweetColumnAssigner"

export interface IProps {
    open: boolean
    assignmentId: number | null
    tweetId: string | null
    onCloseAssigner: any
}

export interface IStoreProps {
    reviewers: IReviewerUser[]
    reviewerAssignmentCounts: IReviewerAssignmentCounts
    assignment: IReviewerAssignment | null
}

export interface IDispatchProps {
    onAssignTweet: Function
    onUnassignTweet: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnAssignerContainer extends React.Component<TComponentProps, {}> {
    private onAssignTweet: any
    private onUnassignTweet: any

    public constructor(props: TComponentProps) {
        super(props)

        this.onAssignTweet = (tweetId: string, userId: number) => {
            this.props.onAssignTweet(tweetId, userId)
            this.props.onCloseAssigner()
        }
        this.onUnassignTweet = (assignment: IReviewerAssignment) => {
            this.props.onUnassignTweet(assignment)
            this.props.onCloseAssigner()
        }
    }

    public render() {
        const { open, tweetId, reviewers, reviewerAssignmentCounts, assignment, onCloseAssigner } = this.props

        return (
            <TweetColumnAssigner
                open={open}
                assignment={assignment}
                tweetId={tweetId}
                reviewers={reviewers}
                reviewerAssignmentCounts={reviewerAssignmentCounts}
                onCloseAssigner={onCloseAssigner}
                onAssignTweet={this.onAssignTweet}
                onUnassignTweet={this.onUnassignTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { reviewers } = state

    const assignment =
        ownProps.assignmentId !== null && ownProps.assignmentId in reviewers.assignments
            ? reviewers.assignments[ownProps.assignmentId]
            : null

    return {
        reviewers: reviewers.users,
        reviewerAssignmentCounts: getUserAssignmentTotals(state),
        assignment,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onAssignTweet: (tweetId: string, userId: number) => {
            dispatch(assignReviewer(tweetId, userId))
        },
        onUnassignTweet: (assignment: IReviewerAssignment) => {
            dispatch(unassignReviewer(assignment.id))
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnAssignerContainer)
