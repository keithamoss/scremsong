import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    changeCurrentReviewer,
    getCurrentReviewer,
    getSortedAssignments,
    IReviewerAssignment,
    IReviewerUser,
    setReviewerOnlineStatus,
} from "../../redux/modules/reviewers"
import { changeUserProfileSettings, eQueueSortBy, IUser } from "../../redux/modules/user"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    assignments: IReviewerAssignment[]
    reviewers: IReviewerUser[]
    currentReviewer: IReviewerUser | null | undefined
}

export interface IDispatchProps {
    onChangeQueueUser: Function
    onChangeQueueSortOrder: Function
    onToggleUserOnlineStatus: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class UserReviewQueueViewContainer extends React.Component<TComponentProps, {}> {
    public render() {
        const {
            user,
            assignments,
            reviewers,
            currentReviewer,
            onChangeQueueUser,
            onChangeQueueSortOrder,
            onToggleUserOnlineStatus,
        } = this.props

        if (user === null || currentReviewer === null || currentReviewer === undefined) {
            return <div />
        }

        return (
            <UserReviewQueueView
                assignments={assignments}
                reviewers={reviewers}
                currentReviewer={currentReviewer}
                userSettings={user.settings}
                onChangeQueueUser={onChangeQueueUser}
                onChangeQueueSortOrder={onChangeQueueSortOrder}
                onToggleUserOnlineStatus={onToggleUserOnlineStatus}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    const { user, reviewers } = state

    const getSortedAssignmentsFilter = getSortedAssignments(state)
    const sortedAssignments = user.user ? getSortedAssignmentsFilter(user.user.settings) : []

    return {
        user: user.user,
        assignments: sortedAssignments,
        reviewers: reviewers.users,
        currentReviewer: getCurrentReviewer(state),
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onChangeQueueUser: (reviewerId: number) => {
            dispatch(changeCurrentReviewer(reviewerId))
        },
        onChangeQueueSortOrder: (queueSortBy: eQueueSortBy) => {
            dispatch(changeUserProfileSettings({ queue_sort_by: queueSortBy }))
        },
        onToggleUserOnlineStatus: (currentReviewer: IReviewerUser) => {
            dispatch(setReviewerOnlineStatus(currentReviewer.id, !currentReviewer.is_accepting_assignments))
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)
