import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { eSocialTwitterRateLimitState } from "../../redux/modules/social"
import AdminPanel from "./AdminPanel"

export interface IProps {
    tweetStreamingConnected: boolean
    twitterRateLimitState: eSocialTwitterRateLimitState
}

export interface IStoreProps {
    //     user: IUser | null
    //     assignments: IReviewerAssignment[]
    //     reviewers: IReviewerUser[]
    //     currentReviewer: IReviewerUser | null | undefined
}

export interface IDispatchProps {
    // onChangeQueueUser: Function
    // onChangeQueueSortOrder: Function
    // onToggleUserOnlineStatus: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class AdminPanelContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { tweetStreamingConnected, twitterRateLimitState } = this.props

        return <AdminPanel tweetStreamingConnected={tweetStreamingConnected} twitterRateLimitState={twitterRateLimitState} />
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    const { app } = state

    return {
        tweetStreamingConnected: app.tweet_streaming_connected,
        twitterRateLimitState: app.twitter_rate_limit_state,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        // onChangeQueueUser: (reviewerId: number) => {
        //     dispatch(changeCurrentReviewer(reviewerId))
        // },
        // onChangeQueueSortOrder: (queueSortBy: eQueueSortBy) => {
        //     dispatch(changeUserProfileSettings({ queue_sort_by: queueSortBy }))
        // },
        // onToggleUserOnlineStatus: (currentReviewer: IReviewerUser) => {
        //     dispatch(setReviewerOnlineStatus(currentReviewer.id, !currentReviewer.is_accepting_assignments))
        // },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AdminPanelContainer)
