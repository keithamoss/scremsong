import { LinearProgress } from '@mui/material'
import * as React from 'react'
import { connect } from 'react-redux'
import { IDashboardStats } from '../../redux/modules/app'
import { IThunkExtras } from '../../redux/modules/interfaces'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { IStore } from '../../redux/modules/reducer'
import { getActiveReviewers } from '../../redux/modules/reviewers'
import { ITriageColumn } from '../../redux/modules/triage'
import DashboardView from './DashboardView'

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

function fetchDashboardStats() {
  // return async (dispatch: Function, _getState: Function, { api, emit }: IThunkExtras) => {
  return async (dispatch: Function, _getState: Function, { api }: IThunkExtras) => {
    const { response, json } = await api.get('/0.1/dashboard/get_stats/', dispatch)

    if (response.status === 200) {
      return json
    }
    return null
  }
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

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  const { triage } = state

  return {
    users: getActiveReviewers(state),
    columns: triage.columns,
  }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
  return {
    // eslint-disable-next-line @typescript-eslint/return-await
    fetchStats: async () => await dispatch(fetchDashboardStats()),
  }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(DashboardViewContainer)
