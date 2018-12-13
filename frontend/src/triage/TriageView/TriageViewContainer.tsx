import * as React from "react"
import { connect } from "react-redux"
import { IStore, IUser } from "src/redux/modules/interfaces"
import TriageView from "./TriageView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    columns: object[]
}

export interface IDispatchProps {}

class TriageViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    public render() {
        const { user, columns } = this.props

        if (user === null) {
            return <div />
        }

        return <TriageView columns={columns} />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { user, triage } = state

    return {
        user: user.user,
        columns: triage.columns,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

const TriageViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TriageViewContainer)

export default TriageViewContainerWrapped
