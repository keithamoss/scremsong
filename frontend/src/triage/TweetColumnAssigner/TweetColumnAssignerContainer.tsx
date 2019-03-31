import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    assignReviewer,
    bulkReassignReviewer,
    getCurrentReviewer,
    getReviewerAssignmentTotals,
    IReviewerAssignment,
    IReviewerAssignmentCounts,
    IReviewerUser,
    reassignReviewer,
    unassignReviewer,
} from "../../redux/modules/reviewers"
import TweetColumnAssigner from "./TweetColumnAssigner"

export interface IProps {
    open: boolean
    assignmentId: number | null
    tweetId: string | null
    mode: eTweetColumnAssignerMode
    onCloseAssigner: any
    onBeforeReassign?: any
}

export interface IStoreProps {
    currentReviewer: IReviewerUser
    reviewers: IReviewerUser[]
    reviewerAssignmentCounts: IReviewerAssignmentCounts
    assignment: IReviewerAssignment | null
}

export interface IDispatchProps {
    onAssignTweet: Function
    onUnassignTweet: Function
    onReassign: Function
    onBulkReassign: Function
}

export enum eTweetColumnAssignerMode {
    ASSIGN = "Assign",
    REASSIGN = "Reassign",
    BULK_REASSIGN = "Bulk Reassign",
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnAssignerContainer extends React.Component<TComponentProps, {}> {
    public render() {
        const {
            open,
            assignment,
            tweetId,
            currentReviewer,
            reviewers,
            reviewerAssignmentCounts,
            mode,
            onCloseAssigner,
            onAssignTweet,
            onUnassignTweet,
            onReassign,
            onBulkReassign,
        } = this.props

        return (
            <TweetColumnAssigner
                open={open}
                assignment={assignment}
                tweetId={tweetId}
                currentReviewer={currentReviewer}
                reviewers={reviewers}
                reviewerAssignmentCounts={reviewerAssignmentCounts}
                mode={mode}
                onCloseAssigner={onCloseAssigner}
                onAssignTweet={onAssignTweet}
                onUnassignTweet={onUnassignTweet}
                onReassign={onReassign}
                onBulkReassign={onBulkReassign}
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
        currentReviewer: getCurrentReviewer(state)!,
        reviewers: reviewers.users,
        reviewerAssignmentCounts: getReviewerAssignmentTotals(state),
        assignment,
    }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
    return {
        onAssignTweet: (tweetId: string, userId: number) => {
            dispatch(assignReviewer(tweetId, userId))
            ownProps.onCloseAssigner()
        },
        onUnassignTweet: (assignment: IReviewerAssignment) => {
            dispatch(unassignReviewer(assignment.id))
            ownProps.onCloseAssigner()
        },
        onReassign: (assignmentId: number, newReviewerId: number) => {
            if ("onBeforeReassign" in ownProps) {
                ownProps.onBeforeReassign(() => {
                    dispatch(reassignReviewer(assignmentId, newReviewerId))
                    ownProps.onCloseAssigner()
                })
            } else {
                dispatch(reassignReviewer(assignmentId, newReviewerId))
                ownProps.onCloseAssigner()
            }
        },
        onBulkReassign: (currentReviewerId: number, newReviewerId: number) => {
            dispatch(bulkReassignReviewer(currentReviewerId, newReviewerId))
            ownProps.onCloseAssigner()
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnAssignerContainer)
