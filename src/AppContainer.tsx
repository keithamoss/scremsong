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
import App from "./App"
import { fetchInitialAppState, toggleSidebarState } from "./redux/modules/app"
import { IAppModule, IStore } from "./redux/modules/interfaces"

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

export interface IStoreProps {
    // From Props
    app: IAppModule
    browser: any
    responsiveDrawer: any
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
    public componentDidMount() {
        this.props.fetchInitialAppState()
    }

    public render() {
        const { app, browser, responsiveDrawer, toggleSidebar, children } = this.props

        if (app.loading === true) {
            return (
                <MuiThemeProvider muiTheme={muiTheme}>
                    <div style={{ backgroundColor: muiTheme.palette!.primary1Color, width: "100%", height: "100%" }}>
                        <LinearProgress mode="indeterminate" color={muiTheme.palette!.accent3Color} />
                    </div>
                </MuiThemeProvider>
            )
        }

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <App
                    muiThemePalette={muiTheme.palette}
                    app={app}
                    defaultBreakPoint={DEFAULT_BREAK_POINT}
                    isResponsiveAndOverBreakPoint={isResponsiveAndOverBreakPoint(browser, responsiveDrawer)}
                    toggleSidebar={toggleSidebar}
                    children={children}
                />
            </MuiThemeProvider>
        )
    }
}

const mapStateToProps = (state: IStore): IStoreProps => {
    const { app, browser, responsiveDrawer } = state

    return {
        app,
        browser,
        responsiveDrawer,
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

const AppContainerWrapped = connect(
    mapStateToProps,
    mapDispatchToProps
)(AppContainer)

export default AppContainerWrapped
