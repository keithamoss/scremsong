import { Badge, CssBaseline, Drawer, IconButton, List, ListItem, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import blue from "@material-ui/core/colors/blue"
import AssignmentIndIcon from "@material-ui/icons/AssignmentInd"
import ViewColumnIcon from "@material-ui/icons/ViewColumn"
import classNames from "classnames"
import * as React from "react"
import { Link, Route } from "react-router-dom"
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
        selectedIcon: {
            color: blue[600],
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
}

class App extends React.Component<IProps & WithStyles, {}> {
    public render() {
        const { userAssignmentCount, location, classes } = this.props

        const QueueLink = (props: any) => <Link to="/queue" {...props} />
        const TriageLink = (props: any) => <Link to="/" {...props} />

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
                    <List>
                        <ListItem button={false} component={QueueLink}>
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
                        <ListItem button={false} component={TriageLink}>
                            <Tooltip title="Go to triage view">
                                <IconButton
                                    aria-label="Triage view"
                                    className={location.pathname === "/" ? classes.selectedIcon : undefined}
                                >
                                    <ViewColumnIcon />
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
                </main>
                <Notifier />
                <AppDisconnectedDialog />
            </div>
        )
    }
}

export default withStyles(styles)(App)
