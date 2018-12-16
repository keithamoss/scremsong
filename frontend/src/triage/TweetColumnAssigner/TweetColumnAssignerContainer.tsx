import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "src/redux/modules/interfaces"
import { assignReviewer, IReviewerAssignment, IReviewerUser, unassignReviewer } from "src/redux/modules/reviewers"
import TweetColumnAssigner from "./TweetColumnAssigner"

export interface IProps {
    open: boolean
    assignment: IReviewerAssignment | null
    tweetId: string | null
    onCloseAssigner: any
}

export interface IStoreProps {
    reviewers: IReviewerUser[]
}

export interface IDispatchProps {
    onAssignTweet: Function
    onUnassignTweet: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnAssignerContainer extends React.Component<TComponentProps, {}> {
    private onAssignTweet: any
    private onUnassignTweet: any

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
    }

    public render() {
        const { open, assignment, tweetId, reviewers, onCloseAssigner } = this.props

        return (
            <TweetColumnAssigner
                open={open}
                assignment={assignment}
                tweetId={tweetId}
                reviewers={reviewers}
                onCloseAssigner={onCloseAssigner}
                onAssignTweet={this.onAssignTweet}
                onUnassignTweet={this.onUnassignTweet}
            />
        )
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    const { reviewers } = state

    return {
        reviewers: reviewers.users,
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
    }
}

const TweetColumnAssignerContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnAssignerContainer)

export default TweetColumnAssignerContainerWrapped
