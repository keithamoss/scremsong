import { ToggleOff } from '@mui/icons-material'
import Autorenew from '@mui/icons-material/Autorenew'
import PlayArrow from '@mui/icons-material/PlayArrow'
import Refresh from '@mui/icons-material/Refresh'
import ToggleOn from '@mui/icons-material/ToggleOn'
import { Button, List, ListItem, ListItemText, ListSubheader, Tooltip, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { ITaskInfo, ITaskQueueInfo } from './types'

const StyledFlexGrid = styled('div')(() => ({
  display: 'flex',
}))

const StyledFlexCol = styled('div')(() => ({
  flex: 1,
}))

const StyledTaskControlButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  marginBottom: theme.spacing(3),
}))

export interface IProps {
  tasks: ITaskQueueInfo
  restartRateLimitCollection: any
  killAndRestartTweetStreaming: any
  launchTaskFillMissingTweets: any
  refreshTasksInfo: any
  isMuzzled: boolean
  toggleMuzzledMode: any
}

export interface IState {}

type TComponentProps = IProps

class RealTimeTweetStreaming extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const {
      tasks,
      restartRateLimitCollection,
      killAndRestartTweetStreaming,
      launchTaskFillMissingTweets,
      refreshTasksInfo,
      isMuzzled,
      toggleMuzzledMode,
    } = this.props

    return (
      <React.Fragment>
        <Tooltip title="Restart the rate limit collection task">
          <StyledTaskControlButton variant="contained" startIcon={<Autorenew />} onClick={restartRateLimitCollection}>
            Restart the rate limit collection task
          </StyledTaskControlButton>
        </Tooltip>

        <Tooltip title="Kill and restart tweet streaming tasks">
          <StyledTaskControlButton variant="contained" startIcon={<Autorenew />} onClick={killAndRestartTweetStreaming}>
            Kill and restart tweet streaming tasks
          </StyledTaskControlButton>
        </Tooltip>

        <Tooltip title="Run the fill missing tweets task">
          <StyledTaskControlButton variant="contained" startIcon={<PlayArrow />} onClick={launchTaskFillMissingTweets}>
            Run the fill missing tweets task
          </StyledTaskControlButton>
        </Tooltip>

        <Tooltip title="Refresh tasks info">
          <StyledTaskControlButton variant="contained" startIcon={<Refresh />} onClick={refreshTasksInfo}>
            Refresh tasks info
          </StyledTaskControlButton>
        </Tooltip>

        <Tooltip title={isMuzzled ? 'Turn muzzled mode off' : 'Turn muzzled mode on'}>
          <StyledTaskControlButton
            variant="contained"
            color={isMuzzled ? 'secondary' : 'primary'}
            startIcon={isMuzzled ? <ToggleOn /> : <ToggleOff />}
            onClick={toggleMuzzledMode}
          >
            Toggle muzzled mode
          </StyledTaskControlButton>
        </Tooltip>

        <StyledFlexGrid>
          {Object.keys(tasks).map((queueName: string) => (
            <StyledFlexCol key={queueName}>
              <Typography variant="h5" gutterBottom>
                {queueName}
              </Typography>
              {tasks[queueName] !== null &&
                Object.keys(tasks[queueName]).map((registryName: string) => (
                  <React.Fragment key={registryName}>
                    <List component="ul" subheader={<ListSubheader component="div">{registryName}</ListSubheader>}>
                      {tasks[queueName][registryName].map((task: ITaskInfo) => (
                        <ListItem key={task.id}>
                          <ListItemText primary={task.name} secondary={task.id} />
                        </ListItem>
                      ))}
                    </List>
                  </React.Fragment>
                ))}
            </StyledFlexCol>
          ))}
        </StyledFlexGrid>
      </React.Fragment>
    )
  }
}

export default RealTimeTweetStreaming
