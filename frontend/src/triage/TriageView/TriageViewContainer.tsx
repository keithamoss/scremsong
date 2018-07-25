import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "src/redux/modules/interfaces"
import TriageView from "./TriageView"

export interface IProps {}

export interface IStoreProps {
    tweets: object[]
}

export interface IDispatchProps {}

// interface IOwnProps {
//     mapId: number
//     muiTheme: IMUITheme
// }

export class TriageViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    public render() {
        const { tweets } = this.props

        return <TriageView tweets={tweets} />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { app } = state

    return { tweets: app.tweets }
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
