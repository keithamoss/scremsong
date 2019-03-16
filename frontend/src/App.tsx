import { Badge, CssBaseline, Drawer, IconButton, List, ListItem, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import blue from "@material-ui/core/colors/blue"
import AssignmentIndIcon from "@material-ui/icons/AssignmentInd"
import DNSIcon from "@material-ui/icons/Dns"
import ViewColumnIcon from "@material-ui/icons/ViewColumn"
import classNames from "classnames"
import * as React from "react"
import { Link, Route } from "react-router-dom"
import AdminPanelContainer from "./admin_panel/AdminPanel/AdminPanelContainer"
import "./App.css"
import AppDisconnectedDialog from "./AppDisconnectedDialog"
import Notifier from "./notifications/Notifier"
import UserReviewQueueViewContainer from "./review/UserReviewQueueView/UserReviewQueueViewContainer"
import TriageViewContainer from "./triage/TriageView/TriageViewContainer"

const drawerWidth = 82

const styles = (theme: Theme) =>
    ({
        root: {
            display: "flex",
            height: "100%",
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: drawerWidth,
        },
        list: {
            paddingTop: 0,
        },
        listItem: {
            borderRight: "2px solid white",
        },
        selectedListItem: {
            borderRight: "2px solid #2196f3",
            // backgroundColor: lightBlue[50],
        },
        selectedIcon: {
            color: blue[600],
        },
        disconnectedBadge: {
            fontWeight: 700,
        },
        content: {
            flexGrow: 1,
            // padding: theme.spacing.unit * 3,
            transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: -drawerWidth,
        },
        contentShift: {
            transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        },
    } as any)

export interface IProps {
    userAssignmentCount: number
    location: Location
    somethingIsBroken: boolean
}

class App extends React.Component<IProps & WithStyles, {}> {
    public render() {
        const { userAssignmentCount, somethingIsBroken, location, classes } = this.props

        const QueueLink = (props: any) => <Link to="/queue" {...props} />
        const TriageLink = (props: any) => <Link to="/" {...props} />
        const AdminLink = (props: any) => <Link to="/admin" {...props} />

        return (
            <div className={classes.root}>
                <CssBaseline />
                <Drawer
                    className={classes.drawer}
                    variant="persistent"
                    anchor="left"
                    open={true}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <List className={classes.list}>
                        <ListItem
                            button={false}
                            component={QueueLink}
                            className={location.pathname === "/queue" ? classes.selectedListItem : classes.listItem}
                        >
                            <Tooltip title="Go to your queue">
                                <IconButton
                                    aria-label="Your queue"
                                    className={location.pathname === "/queue" ? classes.selectedIcon : undefined}
                                >
                                    <Badge badgeContent={userAssignmentCount} color="primary">
                                        <AssignmentIndIcon />
                                    </Badge>
                                </IconButton>
                            </Tooltip>
                        </ListItem>
                        <ListItem
                            button={false}
                            component={TriageLink}
                            className={location.pathname === "/" ? classes.selectedListItem : classes.listItem}
                        >
                            <Tooltip title="Go to triage view">
                                <IconButton
                                    aria-label="Triage view"
                                    className={location.pathname === "/" ? classes.selectedIcon : undefined}
                                >
                                    <ViewColumnIcon />
                                </IconButton>
                            </Tooltip>
                        </ListItem>
                        <ListItem
                            button={false}
                            component={AdminLink}
                            className={location.pathname === "/admin" ? classes.selectedListItem : classes.listItem}
                        >
                            <Tooltip title="Go to the admin panel">
                                <IconButton
                                    aria-label="Admin panel"
                                    className={location.pathname === "/admin" ? classes.selectedIcon : undefined}
                                >
                                    {somethingIsBroken === true && (
                                        <Badge badgeContent={"!"} color="secondary" className={classes.disconnectedBadge}>
                                            <DNSIcon />
                                        </Badge>
                                    )}
                                    {somethingIsBroken === false && <DNSIcon />}
                                </IconButton>
                            </Tooltip>
                        </ListItem>
                    </List>
                </Drawer>
                <main
                    className={classNames(classes.content, {
                        [classes.contentShift]: true,
                    })}
                >
                    <Route path="/queue" component={UserReviewQueueViewContainer} />
                    <Route exact={true} path="/" component={TriageViewContainer} />
                    <Route path="/admin" component={AdminPanelContainer} />
                </main>
                <Notifier />
                <AppDisconnectedDialog />
            </div>
        )
    }
}

export default withStyles(styles)(App)
