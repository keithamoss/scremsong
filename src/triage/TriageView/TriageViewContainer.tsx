import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "src/redux/modules/interfaces"
import TriageView from "./TriageView"

export interface IProps {}

export interface IStoreProps {}

export interface IDispatchProps {}

// interface IOwnProps {
//     mapId: number
//     muiTheme: IMUITheme
// }

export class TriageViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    public render() {
        return <TriageView />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    // const { maps, ealgis } = state

    return {}
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

const TriageViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TriageViewContainer)

// @ts-ignore
export default TriageViewContainerWrapped
