import { createMuiTheme, LinearProgress, Theme, ThemeProvider, withStyles, WithStyles } from '@material-ui/core'
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import App from './App'
import { LoginDialog } from './authentication/login-dialog/LoginDialog'
import { changeSettingsDialogState, loaded, loading } from './redux/modules/app'
import { IStore } from './redux/modules/reducer'
import { changeCurrentReviewer, getPendingUserAssignments } from './redux/modules/reviewers'
import { ESocialTwitterRateLimitState } from './redux/modules/social'
import { fetchUser, ISelf } from './redux/modules/user'

// const Config: IConfig = require("Config") as any

const theme = createMuiTheme({
  // palette: {
  //     primary: purple,
  //     secondary: green,
  // },
  // status: {
  //     danger: "orange",
  // },
})

// eslint-disable-next-line @typescript-eslint/no-shadow
const styles = (theme: Theme) =>
  ({
    loaderBackground: {
      backgroundColor: theme.palette.primary.main,
      width: '100%',
      height: '100%',
    },
    flexboxCentredContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    flexboxCentredBox: {
      width: '70%',
      maxWidth: '300px',
      textAlign: 'center',
      alignItems: 'start',
      '& > div:last-child': {
        marginTop: '-25px',
      },
      '& img': {
        width: '100%',
        height: '100%',
        mixBlendMode: 'luminosity',
      },
      '& h1': {
        fontSize: '38px',
        color: 'white',
      },
    },
  } as any)

export interface IProps {}

export interface IStoreProps {
  isAppLoading: boolean
  userLoggedIn: boolean
  userAssignmentCount: number
  somethingIsBroken: boolean
}

export interface IDispatchProps {
  fetchInitialAppState: Function
  onOpenSettingsDialog: Function
}

export interface IRouteProps {
  content: any
  location: any
}

const canPlayAudio = (audio: HTMLMediaElement) => {
  // https://stackoverflow.com/a/8469184/7368493
  return audio && 'play' in audio && audio.canPlayType && audio.canPlayType('audio/mpeg;').replace(/no/, '') !== ''
}

function fetchInitialAppState() {
  // return async (dispatch: Function, _getState: Function, { api, emit }: IThunkExtras) => {
  return async (dispatch: Function, _getState: Function) => {
    dispatch(loading())

    const self: ISelf = await dispatch(fetchUser())
    if (self.is_logged_in === true) {
      await dispatch(changeCurrentReviewer(self.user.id))
    } else {
      // Show them the login box
      // If they're logged in a succesful web socket connection fires this
      dispatch(loaded())
    }
  }
}

type TComponentProps = IProps & IStoreProps & IDispatchProps & IRouteProps & WithStyles
export class AppContainer extends React.Component<TComponentProps, {}> {
  public componentDidMount() {
    this.props.fetchInitialAppState()
  }

  public playAudio = () => {
    const audio = document.getElementById('scremsong-sound') as HTMLMediaElement
    if (canPlayAudio(audio)) {
      audio.volume = 0.25
      audio.play().catch((_error: any) => null)
    }
  }

  public stopAudio = () => {
    const audio = document.getElementById('scremsong-sound') as HTMLMediaElement
    if (canPlayAudio(audio)) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  public render() {
    const {
      isAppLoading,
      userLoggedIn,
      userAssignmentCount,
      somethingIsBroken,
      onOpenSettingsDialog,
      location,
      children,
      classes,
    } = this.props

    let component
    if (isAppLoading === true) {
      component = (
        <div className={classes.loaderBackground}>
          <LinearProgress />
          <div className={classes.flexboxCentredContainer}>
            <div className={classes.flexboxCentredBox}>
              <div>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <img src="/alex.jpg" onMouseDown={this.playAudio} onMouseUp={this.stopAudio} onBlur={this.stopAudio} />
              </div>
              <div>
                <h1>Screm song! Screm song!</h1>
              </div>
              <audio preload="auto" id="scremsong-sound">
                <source src="dominic_screm_song.mp3" />
              </audio>
            </div>
          </div>
        </div>
      )
    } else if (userLoggedIn === false) {
      component = <LoginDialog open />
    } else {
      component = (
        <App
          userAssignmentCount={userAssignmentCount}
          location={location}
          somethingIsBroken={somethingIsBroken}
          onOpenSettingsDialog={onOpenSettingsDialog}
          children={children}
        />
      )
    }

    return <ThemeProvider theme={theme}>{component}</ThemeProvider>
  }
}

const mapStateToProps = (state: IStore): IStoreProps => {
  const { app, user } = state

  const getPendingUserAssignmentsFilter = getPendingUserAssignments(state)
  const userAssignmentCount = user.user ? getPendingUserAssignmentsFilter(user.user?.id).length : 0

  if (userAssignmentCount > 0) {
    document.title = `(${userAssignmentCount}) Screm song!`
  } else {
    document.title = 'Screm song!'
  }

  return {
    isAppLoading: app.loading,
    userLoggedIn: user.user !== null,
    userAssignmentCount,
    somethingIsBroken:
      app.tweet_streaming_connected === false ||
      app.twitter_rate_limit_state === ESocialTwitterRateLimitState.RATE_LIMITED,
  }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
  return {
    fetchInitialAppState: () => {
      dispatch(fetchInitialAppState())
    },
    onOpenSettingsDialog: () => {
      dispatch(changeSettingsDialogState(true))
    },
  }
}

const AppContainerWrapped = withRouter(
  connect<IStoreProps, IDispatchProps, IProps, IStore>(mapStateToProps, mapDispatchToProps)(AppContainer) as any
)

export default withStyles(styles)(AppContainerWrapped)
