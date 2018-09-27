import { values as objectValues } from "core-js/library/fn/object"
import * as React from "react"
import { connect } from "react-redux"
import {
    fetchAssignments,
    getUserAssignments,
    markAssignmentDone,
    onToggleCurrentReviewerOnlineStatus,
    setCurrentReviewer,
} from "src/redux/modules/app"
import { IStore, IUser } from "src/redux/modules/interfaces"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser
    assignments: object[]
    tweets: object[]
    reviewers: any[]
    currentReviewer: any | null
}

export interface IDispatchProps {
    fetchLatestAssignments: Function
    onMarkAsDone: Function
    onChangeQueueUser: Function
    onToggleUserOnlineStatus: Function
}

class UserReviewQueueViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    // private fetchLatestAssignments: Function

    constructor(props: any) {
        super(props)

        // this.fetchLatestAssignments = props.fetchLatestAssignments.bind(this, props.user)

        // if (props.user !== null) {
        //     window.setInterval(this.fetchLatestAssignments, 10000)
        // }
    }

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

        if (user === null) {
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
    const { user, app } = state

    const reviewer = app.reviewers[app.currentReviewerId!]

    return {
        user: user.user,
        assignments: getUserAssignments(app.assignments, reviewer),
        tweets: app.tweets,
        reviewers: objectValues(app.reviewers),
        currentReviewer: reviewer,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchLatestAssignments: (user: any) => {
            // dispatch(fetchLatestAssignments(user))
        },
        onMarkAsDone: (assignment: any) => {
            dispatch(markAssignmentDone(assignment))
        },
        onChangeQueueUser: async (event: object, key: number, reviewerId: number) => {
            dispatch(setCurrentReviewer(reviewerId))
            await dispatch(fetchAssignments(reviewerId))
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
