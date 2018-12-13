import * as React from "react"
import { connect } from "react-redux"
import { IStore, IUser } from "src/redux/modules/interfaces"
import {
    getCurrentReviewer,
    getCurrentReviewerAssignments,
    IReviewerAssignment,
    markAssignmentDone,
    onToggleCurrentReviewerOnlineStatus,
    setCurrentReviewer,
} from "src/redux/modules/reviewers"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    assignments: IReviewerAssignment[]
    tweets: object[]
    reviewers: any[]
    currentReviewer: any | null
}

export interface IDispatchProps {
    onMarkAsDone: Function
    onChangeQueueUser: Function
    onToggleUserOnlineStatus: Function
}

class UserReviewQueueViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    public render() {
        const {
            user,
            assignments,
            tweets,
            reviewers,
            currentReviewer,
            onMarkAsDone,
            onChangeQueueUser,
            onToggleUserOnlineStatus,
        } = this.props

        if (user === null || currentReviewer === null || currentReviewer === undefined) {
            return <div />
        }

        return (
            <UserReviewQueueView
                assignments={assignments}
                tweets={tweets}
                reviewers={reviewers}
                currentReviewer={currentReviewer}
                onMarkAsDone={onMarkAsDone}
                onChangeQueueUser={onChangeQueueUser}
                onToggleUserOnlineStatus={onToggleUserOnlineStatus}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { user, reviewers, social } = state

    return {
        user: user.user,
        assignments: getCurrentReviewerAssignments(state),
        tweets: social.tweets,
        reviewers: reviewers.users,
        currentReviewer: getCurrentReviewer(state),
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onMarkAsDone: (assignment: any) => {
            dispatch(markAssignmentDone(assignment))
        },
        onChangeQueueUser: async (event: object, key: number, reviewerId: number) => {
            dispatch(setCurrentReviewer(reviewerId))
        },
        onToggleUserOnlineStatus: (event: object, isInputChecked: boolean) => {
            dispatch(onToggleCurrentReviewerOnlineStatus(isInputChecked))
        },
    }
}

const UserReviewQueueViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)

export default UserReviewQueueViewContainerWrapped
