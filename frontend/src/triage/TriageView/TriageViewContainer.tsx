import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { ITriageColumn } from "../../redux/modules/triage"
import { IUser } from "../../redux/modules/user"
import TriageView from "./TriageView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    columns: ITriageColumn[]
}

export interface IDispatchProps {}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TriageViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    public render() {
        const { user, columns } = this.props

        if (user === null) {
            return <div />
        }

        return <TriageView columns={columns} />
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    const { user, triage } = state

    return {
        user: user.user,
        columns: triage.columns,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TriageViewContainer)
