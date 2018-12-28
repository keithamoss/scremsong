import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    assignReviewer,
    bulkReassignReviewer,
    getCurrentReviewer,
    getUserAssignmentTotals,
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
    private onAssignTweet: any
    private onUnassignTweet: any
    private onReassign: any
    private onBulkReassign: any

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
        this.onReassign = (assignmentId: number, newReviewerId: number) => {
            if ("onBeforeReassign" in this.props) {
                this.props.onBeforeReassign(() => {
                    this.props.onReassign(assignmentId, newReviewerId)
                    this.props.onCloseAssigner()
                })
            } else {
                this.props.onReassign(assignmentId, newReviewerId)
                this.props.onCloseAssigner()
            }
        }
    }

    public render() {
        const { open, assignment, tweetId, currentReviewer, reviewers, reviewerAssignmentCounts, mode, onCloseAssigner } = this.props

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
                onAssignTweet={this.onAssignTweet}
                onUnassignTweet={this.onUnassignTweet}
                onReassign={this.onReassign}
                onBulkReassign={this.onBulkReassign}
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
        onReassign: (assignmentId: number, newReviewerId: number) => {
            dispatch(reassignReviewer(assignmentId, newReviewerId))
        },
        onBulkReassign: (currentReviewerId: number, newReviewerId: number) => {
            dispatch(bulkReassignReviewer(currentReviewerId, newReviewerId))
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnAssignerContainer)
