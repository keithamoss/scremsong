import SyncProblemIcon from '@mui/icons-material/SyncProblem'
import { Dialog, DialogContent, DialogTitle, IconButton, Theme } from '@mui/material'
import { withStyles, WithStyles } from '@mui/styles'
import * as React from 'react'
import { connect } from 'react-redux'
import { IStore } from './redux/modules/reducer'

export interface IProps {}

export interface IStoreProps {
  disconnected: boolean
}

export interface IDispatchProps {}

const styles = (theme: Theme) =>
  ({
    disconnectedButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
    },
  } as any)

type TComponentProps = IProps & IStoreProps & IDispatchProps & WithStyles<typeof styles>
class AppDisconnectedDialog extends React.PureComponent<TComponentProps, {}> {
  public render() {
    const { disconnected, classes } = this.props

    return (
      <Dialog aria-labelledby="app-disconnected-title" open={disconnected}>
        <DialogTitle id="app-disconnected-title">
          <IconButton className={classes.disconnectedButton}>
            <SyncProblemIcon color="error" fontSize="large" />
          </IconButton>
          Connection lost. Reconnecting...
        </DialogTitle>
        <DialogContent>
          <img src="/disconnected.jpg" />
        </DialogContent>
      </Dialog>
    )
  }
}

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  return {
    disconnected: !state.app.connected,
  }
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(AppDisconnectedDialog))
