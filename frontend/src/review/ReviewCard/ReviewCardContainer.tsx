import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import {
    IReviewerAssignment,
    markAssignmentAwaitingReply,
    markAssignmentClosed,
    markAssignmentDone,
    markAssignmentRead,
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
    onAwaitReply: Function
    onMarkAsDone: Function
    onMarkAsClosed: Function
    onThreadClosed: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class ReviewCardContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { assignment, tweets, unreadTweetIds, onAwaitReply, onMarkAsDone, onMarkAsClosed, onThreadClosed } = this.props

        return (
            <ReviewCard
                assignment={assignment}
                tweets={tweets}
                unreadTweetIds={unreadTweetIds}
                onAwaitReply={onAwaitReply}
                onMarkAsDone={onMarkAsDone}
                onMarkAsClosed={onMarkAsClosed}
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
        onAwaitReply: () => {
            dispatch(markAssignmentAwaitingReply(ownProps.assignment))
        },
        onMarkAsDone: () => {
            dispatch(markAssignmentDone(ownProps.assignment))
        },
        onMarkAsClosed: () => {
            dispatch(markAssignmentClosed(ownProps.assignment))
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
