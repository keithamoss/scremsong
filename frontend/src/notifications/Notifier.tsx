import { withSnackbar, withSnackbarProps } from 'notistack'
import { Component } from 'react'
import { connect } from 'react-redux'
import { removeSnackbar } from '../redux/modules/app'
import { IStore } from '../redux/modules/reducer'
import { INotification } from '../websockets/actions'

export interface IStoreProps {
  notifications: INotification[]
}

export interface IDispatchProps {
  onRemoveSnackbar: Function
}

export interface IStateProps {
  displayed: string[]
}

type TComponentProps = IStoreProps & IDispatchProps & withSnackbarProps
class Notifier extends Component<TComponentProps, IStateProps> {
  public constructor(props: TComponentProps) {
    super(props)
    this.state = { displayed: [] }
  }

  public storeDisplayed = (key: string) => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    this.setState({ displayed: [...this.state.displayed, ...[key]] })
  }

  public render() {
    const { notifications, enqueueSnackbar, onRemoveSnackbar } = this.props
    const { displayed } = this.state

    notifications.forEach((notification: any) => {
      setTimeout(() => {
        // If notification already displayed, abort
        if (displayed.indexOf(notification.key) > -1) {
          return
        }

        // Display notification using notistack
        enqueueSnackbar(notification.message, notification.options)

        // Add notification's key to the local state
        this.storeDisplayed(notification.key)

        // Dispatch action to remove the notification from the redux store
        onRemoveSnackbar(notification.key)
      }, 1)
    })

    return null
  }
}

const mapStateToProps = (store: IStore) => ({
  notifications: store.app.notifications,
})

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
  return {
    onRemoveSnackbar: (key: string) => {
      dispatch(removeSnackbar(key))
    },
  }
}

export default connect<IStoreProps, IDispatchProps, {}, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(withSnackbar(Notifier))
