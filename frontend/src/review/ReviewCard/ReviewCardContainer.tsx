import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import { getTweetIdsForAssignement, ISocialTweetList } from "../../redux/modules/social"
import ReviewCard from "./ReviewCard"

export interface IProps {
    assignment: IReviewerAssignment
    onMarkAsDone: Function
}

export interface IStoreProps {
    tweets: ISocialTweetList
}

export interface IDispatchProps {}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class ReviewCardContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { assignment, tweets, onMarkAsDone } = this.props

        return <ReviewCard assignment={assignment} tweets={tweets} onMarkAsDone={onMarkAsDone} />
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const getTweetIdsForAssignementFilter = getTweetIdsForAssignement(state)

    return {
        tweets: getTweetIdsForAssignementFilter(ownProps.assignment),
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ReviewCardContainer)
