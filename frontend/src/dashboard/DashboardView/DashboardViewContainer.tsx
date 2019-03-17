import { LinearProgress } from "@material-ui/core"
import * as React from "react"
import { connect } from "react-redux"
import { fetchDashboardStats, IDashboardStats } from "../../redux/modules/app"
import { IStore } from "../../redux/modules/reducer"
import { IReviewerUser } from "../../redux/modules/reviewers"
import { ITriageColumn } from "../../redux/modules/triage"
import DashboardView from "./DashboardView"

export interface IProps {}

export interface IStoreProps {
    users: IReviewerUser[]
    columns: ITriageColumn[]
}

export interface IDispatchProps {
    fetchStats: Function
}

export interface IState {
    stats: IDashboardStats | null
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class DashboardViewContainer extends React.Component<TComponentProps, IState> {
    public constructor(props: TComponentProps) {
        super(props)

        this.state = { stats: null }
    }

    public async componentDidMount() {
        this.setState({ stats: await this.props.fetchStats() })
    }

    public render() {
        const { users, columns } = this.props
        const { stats } = this.state

        if (stats === null) {
            return <LinearProgress />
        }

        return <DashboardView stats={stats} users={users} columns={columns} />
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { reviewers, triage } = state

    return {
        users: reviewers.users,
        columns: triage.columns,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchStats: async () => {
            return await dispatch(fetchDashboardStats())
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(DashboardViewContainer)
