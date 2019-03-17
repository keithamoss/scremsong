import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerUser } from "../../redux/modules/reviewers"
import AssignerAvatar from "./AssignerAvatar"

export interface IProps {
    assignedToUser: IReviewerUser | undefined
    onAssign: Function
    onUnassign: Function
}

export interface IStoreProps {
    triagers: IReviewerUser[]
}

export interface IDispatchProps {
    onAssign: Function
    onUnassign: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class AssignerAvatarContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { assignedToUser, triagers, onAssign, onUnassign } = this.props

        return <AssignerAvatar assignedToUser={assignedToUser} triagers={triagers} onAssign={onAssign} onUnassign={onUnassign} />
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { reviewers } = state

    return {
        triagers: reviewers.users,
    }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
    return {
        onAssign: (userId: number) => {
            ownProps.onAssign(userId)
        },
        onUnassign: () => {
            ownProps.onUnassign()
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(AssignerAvatarContainer)
