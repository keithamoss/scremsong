import { createTheme, LinearProgress, StyledEngineProvider } from '@mui/material'
import { styled, ThemeProvider } from '@mui/material/styles'
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

const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
})

const DivLoaderBackground = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  width: '100%',
  height: '100%',
}))

const DivFlexboxCentredContainer = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
}))

const DivFlexboxCentredBox = styled('div')(() => ({
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
}))

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

const setObtrusiveScrollbarsClass = () => {
  /*
   * Scrollbar Width Test
   * Adds `layout-scrollbar-obtrusive` class to body
   * if scrollbars use up screen real estate.
   */
  // Source: https://www.filamentgroup.com/lab/scrollbars/
  // c.f. App.css
  const parent = document.createElement('div')
  parent.setAttribute('style', 'width:30px;height:30px;')
  parent.classList.add('scrollbar-test')

  const child = document.createElement('div')
  child.setAttribute('style', 'width:100%;height:40px')
  parent.appendChild(child)
  document.body.appendChild(parent)

  // Measure the child element, if it is not
  // 30px wide the scrollbars are obtrusive.
  // const firstChild = parent.firstChild as HTMLElement
  // const clientWidth = parent.firstChild !== null ? firstChild.clientWidth : 0
  // const scrollbarWidth = 30 - clientWidth

  // Note: Hacky OS detection was our addition, because this didn't seem to work
  // if (scrollbarWidth) {
  if (navigator.appVersion.indexOf('Mac') === -1) {
    document.body.classList.add('layout-scrollbar-obtrusive')
  }

  document.body.removeChild(parent)
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

type TComponentProps = IProps & IStoreProps & IDispatchProps & IRouteProps
export class AppContainer extends React.Component<TComponentProps, {}> {
  public componentDidMount() {
    setObtrusiveScrollbarsClass()
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
    } = this.props

    let component
    if (isAppLoading === true) {
      component = (
        <DivLoaderBackground>
          <LinearProgress />
          <DivFlexboxCentredContainer>
            <DivFlexboxCentredBox>
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
            </DivFlexboxCentredBox>
          </DivFlexboxCentredContainer>
        </DivLoaderBackground>
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

    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={appTheme}>{component}</ThemeProvider>
      </StyledEngineProvider>
    )
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

export default withRouter(
  connect<IStoreProps, IDispatchProps, IProps, IStore>(mapStateToProps, mapDispatchToProps)(AppContainer) as any
)
