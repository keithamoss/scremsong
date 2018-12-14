// import CircularProgress from "material-ui/CircularProgress"
import LinearProgress from "material-ui/LinearProgress"
// import styled from "styled-components"
import {
    // deepPurple200,
    deepPurple100,
    deepPurple300,
    deepPurple400,
    // deepPurple900,
    // deepPurple800,
    // deepPurple700,
    // deepPurple600,
    deepPurple500,
    fullBlack,
    white,
    yellow500,
} from "material-ui/styles/colors"
import getMuiTheme from "material-ui/styles/getMuiTheme"
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider"
import { fade } from "material-ui/utils/colorManipulator"
import * as React from "react"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import styled from "styled-components"
import App from "./App"
import { fetchInitialAppState, toggleSidebarState } from "./redux/modules/app"
import { IAppModule, IStore, IUser } from "./redux/modules/interfaces"
import { getUserAssignments } from "./redux/modules/reviewers"

// const Config: IConfig = require("Config") as any

// import { setDrawerOpen } from "material-ui-responsive-drawer"

const muiTheme = getMuiTheme({
    palette: {
        primary1Color: deepPurple500, // AppBar and Tabs, Buttons, Active textfield et cetera
        primary2Color: deepPurple400, // Used for the selected date in DatePicker
        primary3Color: deepPurple100, // Switch background
        accent1Color: deepPurple500, // Active tab highlight colour
        accent2Color: deepPurple400, // Toolbars and switch buttons
        accent3Color: deepPurple300, // Our app LinearProgress bar and Tabs
        textColor: fullBlack,
        alternateTextColor: white, // Buttons and Tabs
        canvasColor: white,
        borderColor: deepPurple100, // Unselected textfield, Divider, et cetera fields
        disabledColor: fade(fullBlack, 0.5), // Unselected textfield et cetera label colour
        pickerHeaderColor: deepPurple300, // Used for DatePicker
        clockCircleColor: fade(yellow500, 0.07), // Unused
        shadowColor: fullBlack,
    },
    appBar: {
        height: 50,
    },
})

const FlexboxCentredContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 100%;
`

const FlexboxCentredBox = styled.div`
    width: 70%;
    max-width: 300px;
    text-align: center;
    align-items: start;

    & > div:last-child {
        margin-top: -25px;
    }

    & img {
        width: 100%;
        height: 100%;
        mix-blend-mode: luminosity;
    }

    & h1 {
        font-size: 38px;
        color: white;
    }
`

export interface IStoreProps {
    // From Props
    app: IAppModule
    user: IUser | null
    browser: any
    responsiveDrawer: any
    userAssignmentCount: number
}

export interface IDispatchProps {
    fetchInitialAppState: Function
    toggleSidebar: Function
}

export interface IRouteProps {
    content: any
    location: any
}

const DEFAULT_BREAK_POINT = "small"
function isResponsiveAndOverBreakPoint(browser: any, responsiveDrawer: any, breakPoint: any = DEFAULT_BREAK_POINT) {
    return browser.greaterThan[breakPoint] && responsiveDrawer.responsive
}

export class AppContainer extends React.Component<any, any> {
    public constructor(props: any) {
        super(props)
        this.playAudio = this.playAudio.bind(this)
        this.stopAudio = this.stopAudio.bind(this)
    }
    public playAudio() {
        const audio = document.getElementById("scremsong-sound") as HTMLMediaElement
        if (this.canPlayAudio(audio)) {
            audio.volume = 0.5
            audio.play()
        }
    }
    public stopAudio() {
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
        const { app, user, browser, responsiveDrawer, userAssignmentCount, toggleSidebar, children } = this.props

        if (app.loading === true) {
            return (
                <MuiThemeProvider muiTheme={muiTheme}>
                    <div style={{ backgroundColor: muiTheme.palette!.primary1Color, width: "100%", height: "100%" }}>
                        <LinearProgress mode="indeterminate" color={muiTheme.palette!.accent3Color} />
                        <FlexboxCentredContainer>
                            <FlexboxCentredBox>
                                <div>
                                    <img id="alex" src="/alex.jpg" onMouseEnter={this.playAudio} onMouseOut={this.stopAudio} />
                                </div>
                                <div>
                                    <h1>Screm song! Screm song!</h1>
                                </div>
                                <audio preload="auto" id="scremsong-sound">
                                    <source src="dominic_screm_song.mp3" />
                                </audio>
                            </FlexboxCentredBox>
                        </FlexboxCentredContainer>
                    </div>
                </MuiThemeProvider>
            )
        }

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <App
                    muiThemePalette={muiTheme.palette}
                    app={app}
                    user={user}
                    defaultBreakPoint={DEFAULT_BREAK_POINT}
                    isResponsiveAndOverBreakPoint={isResponsiveAndOverBreakPoint(browser, responsiveDrawer)}
                    userAssignmentCount={userAssignmentCount}
                    toggleSidebar={toggleSidebar}
                    children={children}
                />
            </MuiThemeProvider>
        )
    }
    private canPlayAudio(audio: HTMLMediaElement) {
        // https://stackoverflow.com/a/8469184/7368493
        return audio && "play" in audio && audio.canPlayType && audio.canPlayType("audio/mpeg;").replace(/no/, "") !== ""
    }
}

const mapStateToProps = (state: IStore): IStoreProps => {
    const { app, user, browser, responsiveDrawer } = state

    const getUserAssignmentsFilter = getUserAssignments(state)
    const userAssignmentCount = user.user ? getUserAssignmentsFilter(user.user!.id).length : 0

    return {
        app,
        user: user.user,
        browser,
        responsiveDrawer,
        userAssignmentCount,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        fetchInitialAppState: () => {
            dispatch(fetchInitialAppState())
        },
        toggleSidebar: () => {
            dispatch(toggleSidebarState())
        },
    }
}

const AppContainerWrapped = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(AppContainer) as any)

export default AppContainerWrapped
