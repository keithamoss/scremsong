import * as React from "react"
import { connect } from "react-redux"
import { fetchLatestAssignments, markAssignmentDone } from "src/redux/modules/app"
import { IStore, IUser } from "src/redux/modules/interfaces"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser
    assignments: object[]
    tweets: object[]
}

export interface IDispatchProps {
    fetchLatestAssignments: Function
    onMarkAsDone: Function
}

const getUserAssignments = (assignments: object[], user: any) => assignments.filter((assignment: any) => assignment.user_id === user.id)

class UserReviewQueueViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    private fetchLatestAssignments: Function

    constructor(props: any) {
        super(props)

        this.fetchLatestAssignments = props.fetchLatestAssignments.bind(this, props.user)

        if (props.user !== null) {
            window.setInterval(this.fetchLatestAssignments, 10000)
        }
    }

    public render() {
        const { user, assignments, tweets, onMarkAsDone } = this.props

        if (user === null) {
            return <div />
        }

        return <UserReviewQueueView user={user} assignments={assignments} tweets={tweets} onMarkAsDone={onMarkAsDone} />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { user, app } = state

    return {
        user: user.user,
        assignments: getUserAssignments(app.assignments, user.user),
        tweets: app.tweets,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchLatestAssignments: (user: any) => {
            dispatch(fetchLatestAssignments(user))
        },
        onMarkAsDone: (assignment: any) => {
            dispatch(markAssignmentDone(assignment))
        },
    }
}

const UserReviewQueueViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)

export default UserReviewQueueViewContainerWrapped
