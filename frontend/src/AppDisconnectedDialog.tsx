import SyncProblemIcon from '@mui/icons-material/SyncProblem'
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { connect } from 'react-redux'
import { IStore } from './redux/modules/reducer'

export interface IProps {}

export interface IStoreProps {
  disconnected: boolean
}

export interface IDispatchProps {}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
}))

type TComponentProps = IProps & IStoreProps & IDispatchProps
class AppDisconnectedDialog extends React.PureComponent<TComponentProps, {}> {
  public render() {
    const { disconnected } = this.props

    return (
      <Dialog aria-labelledby="app-disconnected-title" open={disconnected}>
        <DialogTitle id="app-disconnected-title">
          <StyledIconButton size="large">
            <SyncProblemIcon color="error" fontSize="large" />
          </StyledIconButton>
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
)(AppDisconnectedDialog)
