import { MenuItem } from "material-ui"
import { BodyContainer, ResponsiveDrawer } from "material-ui-responsive-drawer"
// import AppBar from "material-ui/AppBar"
// import Snackbar from "material-ui/Snackbar"
import LinearProgress from "material-ui/LinearProgress"
import * as React from "react"
// import styled from "styled-components"
import { Link, Route } from "react-router-dom"
import "./App.css"
import { LoginDialog } from "./authentication/login-dialog/LoginDialog"
import { IAppModule, IUser } from "./redux/modules/interfaces"
import UserReviewQueueViewContainer from "./review/UserReviewQueueView/UserReviewQueueViewContainer"
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
import TriageViewContainer from "./triage/TriageView/TriageViewContainer"

export interface IProps {
    muiThemePalette: any
    app: IAppModule
    user: IUser
    defaultBreakPoint: string
    isResponsiveAndOverBreakPoint: boolean
    toggleSidebar: any
}

class App extends React.Component<IProps, {}> {
    public render() {
        const { muiThemePalette, app, user, defaultBreakPoint, isResponsiveAndOverBreakPoint } = this.props

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
                    {isResponsiveAndOverBreakPoint === true && (
                        <React.Fragment>
                            <MenuItem containerElement={<Link to={"/"} />}>Triage View</MenuItem>
                            <MenuItem containerElement={<Link to={"/queue"} />}>My Queue</MenuItem>
                        </React.Fragment>
                    )}
                </ResponsiveDrawer>

                <BodyContainer breakPoint={defaultBreakPoint}>
                    <LinearProgress mode="indeterminate" color={muiThemePalette.accent3Color} style={styles.linearProgressStyle} />

                    {/* <ResponsiveAppBar breakPoint={defaultBreakPoint} title={"Scremsong"} zDepth={0} /> */}

                    <LoginDialog open={user === null} />

                    <div className="page-content">
                        <Route path="/queue" component={UserReviewQueueViewContainer} />
                        <Route exact={true} path="/" component={TriageViewContainer} />
                    </div>
                </BodyContainer>
            </div>
        )
    }
}

export default App
