import { AppBar, Badge, Tab, Tabs, Theme } from '@mui/material'
import { withStyles, WithStyles } from '@mui/styles'
import * as React from 'react'
import { ESocialTwitterRateLimitState } from '../../redux/modules/social'
import LogViewerContainer from '../LogViewer/LogViewerContainer'
import RealTimeTweetStreamingContainer from '../RealTimeTweetStreaming/RealTimeTweetStreamingContainer'
import TwitterRateLimitStatusContainer from '../TwitterRateLimitStatus/TwitterRateLimitStatusContainer'

const styles = (theme: Theme) => ({
  root: {
    flexGrow: 1,
    height: '95%',
    backgroundColor: theme.palette.background.paper,
  },
  tabContainer: {
    height: '100%',
    padding: theme.spacing(3),
  },
  disconnectedBadge: {
    fontWeight: 700,
  },
})

export interface IProps {
  tweetStreamingConnected: boolean
  twitterRateLimitState: ESocialTwitterRateLimitState
  pathname: string
  history: any
}

export interface IState {
  activeTab: number
}

type TComponentProps = IProps & WithStyles<typeof styles>

class AdminPanel extends React.PureComponent<TComponentProps, IState> {
  private handleChange: any

  public constructor(props: TComponentProps) {
    super(props)

    const getActiveTab = () => {
      switch (props.pathname) {
        case '/admin/log-viewer':
          return 2
        case '/admin/streaming':
          return 1
        case '/admin/rate-limits':
          return 0
        default:
          return 0
      }
    }
    this.state = {
      activeTab: getActiveTab(),
    }

    this.handleChange = (_event: React.MouseEvent<HTMLElement>, value: number) => {
      switch (value) {
        case 2:
          props.history.push('/admin/log-viewer')
          break
        case 1:
          props.history.push('/admin/streaming')
          break
        case 0:
          props.history.push('/admin/rate-limits')
          break
      }
    }
  }

  public render() {
    const { tweetStreamingConnected, twitterRateLimitState, classes } = this.props
    const { activeTab } = this.state

    const TabContainer = (props: any) => <div className={classes.tabContainer}>{props.children}</div>

    return (
      <React.Fragment>
        <div className={classes.root}>
          <AppBar position="static">
            <Tabs value={activeTab} onChange={this.handleChange}>
              {twitterRateLimitState === ESocialTwitterRateLimitState.RATE_LIMITED && (
                <Tab
                  label={
                    <Badge badgeContent="!" color="secondary" className={classes.disconnectedBadge}>
                      Twitter rate limits
                    </Badge>
                  }
                />
              )}
              {twitterRateLimitState !== ESocialTwitterRateLimitState.RATE_LIMITED && (
                <Tab label="Twitter rate limits" />
              )}

              {tweetStreamingConnected === false && (
                <Tab
                  label={
                    <Badge badgeContent="!" color="secondary" className={classes.disconnectedBadge}>
                      Real-time Tweet Streaming
                    </Badge>
                  }
                />
              )}
              {tweetStreamingConnected === true && <Tab label="Real-time Tweet Streaming" />}

              <Tab label="Log viewer" />
            </Tabs>
          </AppBar>

          {activeTab === 0 && (
            <TabContainer>
              <TwitterRateLimitStatusContainer />
            </TabContainer>
          )}
          {activeTab === 1 && (
            <TabContainer>
              <RealTimeTweetStreamingContainer />
            </TabContainer>
          )}
          {activeTab === 2 && (
            <TabContainer>
              <LogViewerContainer />
            </TabContainer>
          )}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(AdminPanel)
