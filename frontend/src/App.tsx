/* eslint-disable react/prefer-stateless-function */
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DNSIcon from '@mui/icons-material/Dns'
import HelpIcon from '@mui/icons-material/Help'
import NewReleases from '@mui/icons-material/NewReleases'
import SettingsIcon from '@mui/icons-material/Settings'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { Badge, CssBaseline, Drawer, IconButton, List, ListItem, Tooltip } from '@mui/material'
import blue from '@mui/material/colors/blue'
import { styled } from '@mui/material/styles'
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

const StyledRootContainerDiv = styled('div')(() => ({
  display: 'flex',
  height: '100%',
}))

const StyledDrawer = styled(Drawer)(() => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .paper': {
    width: drawerWidth,
  },
}))

const StyledList = styled(List)(() => ({
  paddingTop: 0,
}))

const StyledDisconnectedBadge = styled(Badge)(() => ({
  fontWeight: 700,
}))

const StyledContentMain = styled('main')(() => ({
  flexGrow: 1,
  // marginLeft: -drawerWidth,
  marginLeft: 0,
}))

export interface IProps {
  userAssignmentCount: number
  location: Location
  somethingIsBroken: boolean
  onOpenSettingsDialog: any
}

class App extends React.Component<React.PropsWithChildren<IProps>, {}> {
  public render() {
    const { userAssignmentCount, somethingIsBroken, onOpenSettingsDialog, location } = this.props

    return (
      <StyledRootContainerDiv>
        <CssBaseline />
        <StyledDrawer variant="persistent" anchor="left" open>
          <StyledList>
            <ListItem
              button={false}
              component={Link}
              to="/queue"
              sx={{ borderRight: location.pathname === '/queue' ? '2px solid #2196f3' : '2px solid white' }}
            >
              <Tooltip title="Go to your queue" enterDelay={1000}>
                <IconButton
                  aria-label="Your queue"
                  sx={{ color: location.pathname === '/queue' ? blue[600] : undefined }}
                  size="large"
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
              sx={{ borderRight: location.pathname === '/triage' ? '2px solid #2196f3' : '2px solid white' }}
            >
              <Tooltip title="Go to triage view" enterDelay={1000}>
                <IconButton
                  aria-label="Triage view"
                  sx={{ color: location.pathname === '/triage' ? blue[600] : undefined }}
                  size="large"
                >
                  <ViewColumnIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="/"
              sx={{ borderRight: location.pathname === '/' ? '2px solid #2196f3' : '2px solid white' }}
            >
              <Tooltip title="Go to dashboard view" enterDelay={1000}>
                <IconButton
                  aria-label="Dashboard view"
                  sx={{ color: location.pathname === '/' ? blue[600] : undefined }}
                  size="large"
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem
              button={false}
              component={Link}
              to="/admin/rate-limits"
              sx={{ borderRight: location.pathname.startsWith('/admin/') ? '2px solid #2196f3' : '2px solid white' }}
            >
              <Tooltip title="Go to the admin panel" enterDelay={1000}>
                <IconButton
                  aria-label="Admin panel"
                  sx={{ color: location.pathname.startsWith('/admin/') ? blue[600] : undefined }}
                  size="large"
                >
                  {somethingIsBroken === true && (
                    <StyledDisconnectedBadge badgeContent="!" color="secondary">
                      <DNSIcon />
                    </StyledDisconnectedBadge>
                  )}
                  {somethingIsBroken === false && <DNSIcon />}
                </IconButton>
              </Tooltip>
            </ListItem>
            <ListItem button={false} onClick={onOpenSettingsDialog}>
              <Tooltip title="Change your settings" enterDelay={1000}>
                <IconButton aria-label="Change settings" size="large">
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
                <IconButton aria-label="Help" size="large">
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
                <IconButton aria-label="Help" size="large">
                  <NewReleases />
                </IconButton>
              </Tooltip>
            </ListItem>
          </StyledList>
        </StyledDrawer>
        <StyledContentMain>
          <Route exact path="/" component={DashboardViewContainer} />
          <Route path="/queue" component={UserReviewQueueViewContainer} />
          <Route path="/triage" component={TriageViewContainer} />
          <Route path="/admin/rate-limits" component={AdminPanelContainer} />
          <Route path="/admin/streaming" component={AdminPanelContainer} />
          <Route path="/admin/log-viewer" component={AdminPanelContainer} />
        </StyledContentMain>
        <Notifier />
        <AppDisconnectedDialog />
        <SettingsDialogContainer />
      </StyledRootContainerDiv>
    )
  }
}

export default App
