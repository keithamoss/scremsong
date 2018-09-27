import { values as objectValues } from "core-js/library/fn/object"
import * as React from "react"
import { connect } from "react-redux"
import { fetchAssignments, getUserAssignments, markAssignmentDone, setCurrentReviewer } from "src/redux/modules/app"
import { IStore, IUser } from "src/redux/modules/interfaces"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser
    assignments: object[]
    tweets: object[]
    reviewers: any[]
    currentReviewerId: number | null
}

export interface IDispatchProps {
    fetchLatestAssignments: Function
    onMarkAsDone: Function
    onChangeQueueUser: Function
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
        const { user, assignments, tweets, reviewers, currentReviewerId, onMarkAsDone, onChangeQueueUser } = this.props

        if (user === null) {
            return <div />
        }

        return (
            <UserReviewQueueView
                assignments={assignments}
                tweets={tweets}
                reviewers={reviewers}
                currentReviewerId={currentReviewerId}
                onMarkAsDone={onMarkAsDone}
                onChangeQueueUser={onChangeQueueUser}
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
        currentReviewerId: app.currentReviewerId,
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
            console.log("onChangeQueueUser", event, key, reviewerId)
            dispatch(setCurrentReviewer(reviewerId))
            await dispatch(fetchAssignments(reviewerId))
        },
    }
}

const UserReviewQueueViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)

export default UserReviewQueueViewContainerWrapped
