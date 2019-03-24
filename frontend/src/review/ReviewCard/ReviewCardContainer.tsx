import * as React from "react"
import { connect } from "react-redux"
import { INotification, sendNotification } from "../../redux/modules/app"
import { IStore } from "../../redux/modules/reducer"
import {
    closeAssignment,
    eSocialAssignmentCloseReason,
    IReviewerAssignment,
    markAssignmentRead,
    restoreAssignment,
} from "../../redux/modules/reviewers"
import { getTweetsForAssignment, getUnreadTweetIds, ISocialTweetList } from "../../redux/modules/social"
import ReviewCard from "./ReviewCard"

export interface IProps {
    assignment: IReviewerAssignment
}

export interface IStoreProps {
    tweets: ISocialTweetList
    unreadTweetIds: string[]
}

export interface IDispatchProps {
    onCloseAssignment: Function
    sendNotificationWithUndo: Function
    onRestoreAssignment: Function
    onThreadClosed: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class ReviewCardContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const {
            assignment,
            tweets,
            unreadTweetIds,
            onCloseAssignment,
            sendNotificationWithUndo,
            onRestoreAssignment,
            onThreadClosed,
        } = this.props

        return (
            <ReviewCard
                assignment={assignment}
                tweets={tweets}
                unreadTweetIds={unreadTweetIds}
                onCloseAssignment={onCloseAssignment}
                sendNotificationWithUndo={sendNotificationWithUndo}
                onRestoreAssignment={onRestoreAssignment}
                onThreadClosed={onThreadClosed}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const getTweetsForAssignmentFilter = getTweetsForAssignment(state)

    const tweets: ISocialTweetList = getTweetsForAssignmentFilter(ownProps.assignment)

    return {
        tweets,
        unreadTweetIds: getUnreadTweetIds(ownProps.assignment, tweets),
    }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
    return {
        onCloseAssignment: (reason: eSocialAssignmentCloseReason) => {
            dispatch(closeAssignment(ownProps.assignment, reason))
        },
        sendNotificationWithUndo: (notification: INotification) => {
            dispatch(sendNotification(notification))
        },
        onRestoreAssignment: () => {
            dispatch(restoreAssignment(ownProps.assignment))
        },
        onThreadClosed: () => {
            dispatch(markAssignmentRead(ownProps.assignment))
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ReviewCardContainer)
