import * as React from 'react'
import { connect } from 'react-redux'
import { changeSettingsDialogState } from '../../redux/modules/app'
import { IStore } from '../../redux/modules/reducer'
import { changeUserProfileSettings, IProfileSettings } from '../../redux/modules/user'
import SettingsDialog from './SettingsDialog'

export interface IProps {}

export interface IStoreProps {
  settings: IProfileSettings
  open: boolean
}

export interface IDispatchProps {
  onChangeSetting: Function
  onCloseDialog: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class SettingsDialogContainer extends React.PureComponent<TComponentProps, {}> {
  public render() {
    const { settings, open, onChangeSetting, onCloseDialog } = this.props

    return (
      <SettingsDialog settings={settings} open={open} onChangeSetting={onChangeSetting} onCloseDialog={onCloseDialog} />
    )
  }
}

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  const { app, user } = state

  return {
    settings: user.user!.settings,
    open: app.settings_dialog_open,
  }
}

const mapDispatchToProps = (dispatch: Function, _ownProps: IProps): IDispatchProps => {
  return {
    onChangeSetting: (settingName: string, value: any) => {
      dispatch(changeUserProfileSettings({ [settingName]: value }))
    },
    onCloseDialog: () => {
      dispatch(changeSettingsDialogState(false))
    },
  }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(SettingsDialogContainer)
