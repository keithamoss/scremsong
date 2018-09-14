import * as React from "react"
import { connect } from "react-redux"
import { fetchLatestTweets } from "src/redux/modules/app"
import { IStore, IUser } from "src/redux/modules/interfaces"
import UserReviewQueueView from "./UserReviewQueueView"

export interface IProps {}

export interface IStoreProps {
    user: IUser
    // columns: object[]
}

export interface IDispatchProps {
    fetchLatestTweets: Function
}

export class UserReviewQueueViewContainer extends React.Component<IProps & IStoreProps & IDispatchProps, {}> {
    // private fetchLatestTweets: Function

    constructor(props: any) {
        super(props)

        // this.fetchLatestTweets = props.fetchLatestTweets.bind(this, props.columns)

        // if (props.user !== null) {
        //     window.setInterval(this.fetchLatestTweets, 5000)
        // }
    }

    public render() {
        // const { user, columns } = this.props

        // if (user === null) {
        //     return <div />
        // }

        return <UserReviewQueueView />
    }
}

const mapStateToProps = (state: IStore, ownProps: any): IStoreProps => {
    const { user } = state

    return {
        user: user.user,
        // columns: [app.columns[1]],
        // columns: app.columns,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchLatestTweets: (columns: any) => {
            dispatch(fetchLatestTweets(columns))
        },
    }
}

const UserReviewQueueViewContainerWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(UserReviewQueueViewContainer)

export default UserReviewQueueViewContainerWrapped
