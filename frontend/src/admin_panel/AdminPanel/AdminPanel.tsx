import { AppBar, Badge, Tab, Tabs } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { ESocialTwitterRateLimitState } from '../../redux/modules/social'
import LogViewerContainer from '../LogViewer/LogViewerContainer'
import RealTimeTweetStreamingContainer from '../RealTimeTweetStreaming/RealTimeTweetStreamingContainer'
import TwitterRateLimitStatusContainer from '../TwitterRateLimitStatus/TwitterRateLimitStatusContainer'

const StyledRootDiv = styled('div')(({ theme }) => ({
  flexGrow: 1,
  height: '95%',
  backgroundColor: theme.palette.background.paper,
}))

const StyledTabContainerDiv = styled('div')(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(3),
}))

export interface IProps {
  tweetStreamingConnected: boolean
  twitterRateLimitState: ESocialTwitterRateLimitState
  pathname: string
  history: any
}

export interface IState {
  activeTab: number
}

type TComponentProps = IProps

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

    this.handleChange = (_event: React.SyntheticEvent<HTMLElement>, value: number) => {
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
    const { tweetStreamingConnected, twitterRateLimitState } = this.props
    const { activeTab } = this.state

    return (
      <React.Fragment>
        <StyledRootDiv>
          <AppBar position="static">
            <Tabs value={activeTab} onChange={this.handleChange} textColor="inherit" indicatorColor="secondary">
              {twitterRateLimitState === ESocialTwitterRateLimitState.RATE_LIMITED && (
                <Tab
                  label={
                    <Badge badgeContent="!" color="secondary">
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
                    <Badge badgeContent="!" color="secondary">
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
            <StyledTabContainerDiv>
              <TwitterRateLimitStatusContainer />
            </StyledTabContainerDiv>
          )}
          {activeTab === 1 && (
            <StyledTabContainerDiv>
              <RealTimeTweetStreamingContainer />
            </StyledTabContainerDiv>
          )}
          {activeTab === 2 && (
            <StyledTabContainerDiv>
              <LogViewerContainer />
            </StyledTabContainerDiv>
          )}
        </StyledRootDiv>
      </React.Fragment>
    )
  }
}

export default AdminPanel
