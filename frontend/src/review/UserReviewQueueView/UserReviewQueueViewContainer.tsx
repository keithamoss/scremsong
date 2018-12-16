import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    getCurrentReviewer,
    getCurrentReviewerAssignments,
    IReviewerAssignment,
    IReviewerUser,
    markAssignmentDone,
    setCurrentReviewer,
    setReviewerOnlineStatus,
} from "../../redux/modules/reviewers"
import { IUser } from "../../redux/modules/user"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    assignments: IReviewerAssignment[]
    reviewers: IReviewerUser[]
    currentReviewer: IReviewerUser | null | undefined
}

export interface IDispatchProps {
    onMarkAsDone: Function
    onChangeQueueUser: Function
    onToggleUserOnlineStatus: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class UserReviewQueueViewContainer extends React.Component<TComponentProps, {}> {
    public render() {
        const { user, assignments, reviewers, currentReviewer, onMarkAsDone, onChangeQueueUser, onToggleUserOnlineStatus } = this.props

        if (user === null || currentReviewer === null || currentReviewer === undefined) {
            return <div />
        }

        return (
            <UserReviewQueueView
                assignments={assignments}
                reviewers={reviewers}
                currentReviewer={currentReviewer}
                onMarkAsDone={onMarkAsDone}
                onChangeQueueUser={onChangeQueueUser}
                onToggleUserOnlineStatus={onToggleUserOnlineStatus}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    const { user, reviewers } = state

    return {
        user: user.user,
        assignments: getCurrentReviewerAssignments(state),
        reviewers: reviewers.users,
        currentReviewer: getCurrentReviewer(state),
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onMarkAsDone: (assignment: IReviewerAssignment) => {
            dispatch(markAssignmentDone(assignment))
        },
        onChangeQueueUser: (event: object, reviewerId: number) => {
            dispatch(setCurrentReviewer(reviewerId))
        },
        onToggleUserOnlineStatus: (event: MouseEvent, currentReviewer: IReviewerUser) => {
            dispatch(setReviewerOnlineStatus(currentReviewer.id, !currentReviewer.is_accepting_assignments))
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)
