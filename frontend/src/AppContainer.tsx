import { createMuiTheme, LinearProgress, MuiThemeProvider, Theme, withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import App from "./App"
import { LoginDialog } from "./authentication/login-dialog/LoginDialog"
import { fetchInitialAppState } from "./redux/modules/app"
import { IStore } from "./redux/modules/reducer"
import { getUserAssignments } from "./redux/modules/reviewers"
import { eSocialTwitterRateLimitState } from "./redux/modules/social"

// const Config: IConfig = require("Config") as any

const theme = createMuiTheme({
    // palette: {
    //     primary: purple,
    //     secondary: green,
    // },
    typography: {
        useNextVariants: true,
    },
    // status: {
    //     danger: "orange",
    // },
})

// tslint:disable-next-line:no-shadowed-variable
const styles = (theme: Theme) =>
    ({
        loaderBackground: {
            backgroundColor: theme.palette.primary.main,
            width: "100%",
            height: "100%",
        },
        flexboxCentredContainer: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
        },
        flexboxCentredBox: {
            width: "70%",
            maxWidth: "300px",
            textAlign: "center",
            alignItems: "start",
            "& > div:last-child": {
                marginTop: "-25px",
            },
            "& img": {
                width: "100%",
                height: "100%",
                mixBlendMode: "luminosity",
            },
            "& h1": {
                fontSize: "38px",
                color: "white",
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
}

export interface IRouteProps {
    content: any
    location: any
}

type TComponentProps = IProps & IStoreProps & IDispatchProps & IRouteProps & WithStyles
export class AppContainer extends React.Component<TComponentProps, {}> {
    public playAudio = () => {
        const audio = document.getElementById("scremsong-sound") as HTMLMediaElement
        if (this.canPlayAudio(audio)) {
            audio.volume = 0.5
            audio.play().catch((error: any) => null)
        }
    }

    public stopAudio = () => {
        const audio = document.getElementById("scremsong-sound") as HTMLMediaElement
        if (this.canPlayAudio(audio)) {
            audio.pause()
            audio.currentTime = 0
        }
    }

    public componentDidMount() {
        this.props.fetchInitialAppState()
    }

    public render() {
        const { isAppLoading, userLoggedIn, userAssignmentCount, somethingIsBroken, location, children, classes } = this.props

        let component
        if (isAppLoading === true) {
            component = (
                <div className={classes.loaderBackground}>
                    <LinearProgress />
                    <div className={classes.flexboxCentredContainer}>
                        <div className={classes.flexboxCentredBox}>
                            <div>
                                <img src="/alex.jpg" onMouseEnter={this.playAudio} onMouseOut={this.stopAudio} />
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
            component = <LoginDialog open={true} />
        } else {
            component = (
                <App
                    userAssignmentCount={userAssignmentCount}
                    location={location}
                    somethingIsBroken={somethingIsBroken}
                    children={children}
                />
            )
        }

        return <MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>
    }
    private canPlayAudio(audio: HTMLMediaElement) {
        // https://stackoverflow.com/a/8469184/7368493
        return audio && "play" in audio && audio.canPlayType && audio.canPlayType("audio/mpeg;").replace(/no/, "") !== ""
    }
}

const mapStateToProps = (state: IStore): IStoreProps => {
    const { app, user } = state

    const getUserAssignmentsFilter = getUserAssignments(state)
    const userAssignmentCount = user.user ? getUserAssignmentsFilter(user.user!.id).length : 0

    if (userAssignmentCount > 0) {
        document.title = `(${userAssignmentCount}) Screm song!`
    }

    return {
        isAppLoading: app.loading,
        userLoggedIn: user.user !== null,
        userAssignmentCount,
        somethingIsBroken: app.tweet_streaming_connected || app.twitter_rate_limit_state === eSocialTwitterRateLimitState.RATE_LIMITED,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchInitialAppState: () => {
            dispatch(fetchInitialAppState())
        },
    }
}

const AppContainerWrapped = withRouter(connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(AppContainer) as any)

export default withStyles(styles)(AppContainerWrapped)
