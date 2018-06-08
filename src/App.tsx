import { BodyContainer, ResponsiveAppBar, ResponsiveDrawer } from "material-ui-responsive-drawer"
// import AppBar from "material-ui/AppBar"
// import Snackbar from "material-ui/Snackbar"
import LinearProgress from "material-ui/LinearProgress"
import * as React from "react"
// import styled from "styled-components"
import { Route } from "react-router-dom"
import "./App.css"
import { IAppModule } from "./redux/modules/interfaces"
// import { MapsMap, MapsAddLocation, ActionSearch, ActionStore, ActionInfo, HardwareTv, CommunicationEmail } from "material-ui/svg-icons"
// import Drawer from "material-ui/Drawer"
// import { BottomNavigation, BottomNavigationItem } from "material-ui/BottomNavigation"
// import Paper from "material-ui/Paper"
// import { List, ListItem } from "material-ui/List"
// import Subheader from "material-ui/Subheader"
// import Divider from "material-ui/Divider"
// const logo = require("./logo.svg")
// const TitleContainer = styled.div`
//     display: flex;
//     align-items: center;
//     font-size: 20px !important;
// `
// const TitleLogo = styled.img`
//     height: 32px;
//     margin-right: 10px;
// `
import { TriageViewContainer } from "./triage/TriageView/TriageViewContainer"

export interface IProps {
    muiThemePalette: any
    app: IAppModule
    defaultBreakPoint: string
    isResponsiveAndOverBreakPoint: boolean
    toggleSidebar: any
}

class App extends React.Component<IProps, {}> {
    public render() {
        const { muiThemePalette, app, defaultBreakPoint, isResponsiveAndOverBreakPoint } = this.props

        const styles: any = {
            linearProgressStyle: {
                position: "fixed",
                top: "0px",
                zIndex: 1200,
                display: app.requestsInProgress > 0 ? "block" : "none",
            },
        }

        return (
            <div className="page">
                <ResponsiveDrawer breakPoint={defaultBreakPoint}>
                    {isResponsiveAndOverBreakPoint === true && <div>Item</div>}
                </ResponsiveDrawer>

                <BodyContainer breakPoint={defaultBreakPoint}>
                    <LinearProgress mode="indeterminate" color={muiThemePalette.accent3Color} style={styles.linearProgressStyle} />

                    <ResponsiveAppBar breakPoint={defaultBreakPoint} title={"Starter Kit"} zDepth={0} />

                    <div className="page-content">
                        <Route path="/" component={TriageViewContainer} />
                    </div>
                </BodyContainer>
            </div>
        )
    }
}

export default App
