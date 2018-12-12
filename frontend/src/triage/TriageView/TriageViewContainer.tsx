import * as React from "react"
import { connect } from "react-redux"
import { IStore, IUser } from "src/redux/modules/interfaces"
import TriageView from "./TriageView"

export interface IProps {}

export interface IStoreProps {
    user: IUser | null
    columns: object[]
}

export interface IDispatchProps {
    fetchLatestTweets: Function
}

class TriageViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    // private fetchLatestTweets: Function

    constructor(props: any) {
        super(props)

        // this.fetchLatestTweets = props.fetchLatestTweets.bind(this, props.columns)

        // if (props.user !== null) {
        //     window.setInterval(this.fetchLatestTweets, 5000)
        // }
    }

    public render() {
        const { user, columns } = this.props

        if (user === null) {
            return <div />
        }

        return <TriageView columns={columns} />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { user, app } = state

    return {
        user: user.user,
        // columns: [app.columns[1]],
        columns: app.columns,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchLatestTweets: (columns: any) => {
            // dispatch(fetchLatestTweets(columns))
        },
    }
}

const TriageViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TriageViewContainer)

export default TriageViewContainerWrapped
