/* eslint-disable react/prefer-stateless-function */
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DNSIcon from '@mui/icons-material/Dns'
import HelpIcon from '@mui/icons-material/Help'
import NewReleases from '@mui/icons-material/NewReleases'
import SettingsIcon from '@mui/icons-material/Settings'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { Badge, CssBaseline, Drawer, IconButton, List, ListItem, Theme, Tooltip } from '@mui/material'
import blue from '@mui/material/colors/blue'
import { withStyles, WithStyles } from '@mui/styles'
import classNames from 'classnames'
import * as React from 'react'
import { Link, Route } from 'react-router-dom'
import AdminPanelContainer from './admin_panel/AdminPanel/AdminPanelContainer'
import './App.css'
import AppDisconnectedDialog from './AppDisconnectedDialog'
import DashboardViewContainer from './dashboard/DashboardView/DashboardViewContainer'
import Notifier from './notifications/Notifier'
import UserReviewQueueViewContainer from './review/UserReviewQueueView/UserReviewQueueViewContainer'
import SettingsDialogContainer from './settings/SettingsDialog/SettingsDialogContainer'
import TriageViewContainer from './triage/TriageView/TriageViewContainer'

const drawerWidth = 82

const styles = (theme: Theme) =>
  ({
    root: {
      display: 'flex',
      height: '100%',
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
      borderRight: '2px solid white',
    },
    selectedListItem: {
      borderRight: '2px solid #2196f3',
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
      // padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
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
  onOpenSettingsDialog: any
}

class App extends React.Component<React.PropsWithChildren<IProps & WithStyles<typeof styles>>, {}> {
  public render() {
    const { userAssignmentCount, somethingIsBroken, onOpenSettingsDialog, location, classes } = this.props

    return (
      <div className={classes.root}>
        <CssBaseline />
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <List className={classes.list}>
            <ListItem
              button={false}
              component={Link}
              to="/queue"
              className={location.pathname === '/queue' ? classes.selectedListItem : classes.listItem}
            >
              <Tooltip title="Go to your queue" enterDelay={1000}>
                <IconButton
                  aria-label="Your queue"
                  className={location.pathname === '/queue' ? classes.selectedIcon : undefined}
                >
                  <Badge badgeContent={userAssignmentCount} color="primary">
                    <AssignmentIndIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="/triage"
              className={location.pathname === '/triage' ? classes.selectedListItem : classes.listItem}
            >
              <Tooltip title="Go to triage view" enterDelay={1000}>
                <IconButton
                  aria-label="Triage view"
                  className={location.pathname === '/triage' ? classes.selectedIcon : undefined}
                >
                  <ViewColumnIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="/"
              className={location.pathname === '/' ? classes.selectedListItem : classes.listItem}
            >
              <Tooltip title="Go to dashboard view" enterDelay={1000}>
                <IconButton
                  aria-label="Dashboard view"
                  className={location.pathname === '/' ? classes.selectedIcon : undefined}
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="/admin/rate-limits"
              className={location.pathname.startsWith('/admin/') ? classes.selectedListItem : classes.listItem}
            >
              <Tooltip title="Go to the admin panel" enterDelay={1000}>
                <IconButton
                  aria-label="Admin panel"
                  className={location.pathname.startsWith('/admin/') ? classes.selectedIcon : undefined}
                >
                  {somethingIsBroken === true && (
                    <Badge badgeContent="!" color="secondary" className={classes.disconnectedBadge}>
                      <DNSIcon />
                    </Badge>
                  )}
                  {somethingIsBroken === false && <DNSIcon />}
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem button={false} onClick={onOpenSettingsDialog}>
              <Tooltip title="Change your settings" enterDelay={1000}>
                <IconButton aria-label="Change settings">
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="https://docs.google.com/presentation/d/1MLIObFgdieLbfXcIrr8G7s0rfpJN5UrC2iaf8zMnows/edit?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              <Tooltip title="Scremsong Tour & User Guide" enterDelay={1000}>
                <IconButton aria-label="Help">
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="https://github.com/keithamoss/scremsong/blob/master/CHANGELOG.md"
              target="_blank"
              rel="noreferrer"
            >
              <Tooltip title="Find out what's new and shiny in Scremsong" enterDelay={1000}>
                <IconButton aria-label="Help">
                  <NewReleases />
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
          <Route exact path="/" component={DashboardViewContainer} />
          <Route path="/queue" component={UserReviewQueueViewContainer} />
          <Route path="/triage" component={TriageViewContainer} />
          <Route path="/admin/rate-limits" component={AdminPanelContainer} />
          <Route path="/admin/streaming" component={AdminPanelContainer} />
          <Route path="/admin/log-viewer" component={AdminPanelContainer} />
        </main>
        <Notifier />
        <AppDisconnectedDialog />
        <SettingsDialogContainer />
      </div>
    )
  }
}

export default withStyles(styles)(App)
