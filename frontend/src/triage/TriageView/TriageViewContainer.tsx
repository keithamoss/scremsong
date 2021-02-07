import * as React from 'react'
import { connect } from 'react-redux'
import { IStore } from '../../redux/modules/reducer'
import { ITriageColumn } from '../../redux/modules/triage'
import { IUser } from '../../redux/modules/user'
import TriageView from './TriageView'

export interface IProps {}

export interface IStoreProps {
  user: IUser | null
  columns: ITriageColumn[]
}

export interface IDispatchProps {}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TriageViewContainer extends React.Component<TComponentProps, {}> {
  public render() {
    const { user, columns } = this.props

    if (user === null) {
      return <div />
    }

    return (
      <TriageView
        columns={columns}
        onlyShowAssignedColumns={user.settings.triage_only_show_assigned_columns}
        userId={user.id}
      />
    )
  }
}

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  const { user, triage } = state

  return {
    user: user.user,
    columns: triage.columns,
  }
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(TriageViewContainer)
