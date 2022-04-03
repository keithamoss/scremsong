import {
  Button,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Theme,
  Tooltip,
  Typography,
  withStyles,
  WithStyles,
} from '@material-ui/core'
import Refresh from '@material-ui/icons/Refresh'
import classNames from 'classnames'
import * as React from 'react'
import { ITaskInfo, ITaskQueueInfo } from './types'

const styles = (theme: Theme) => ({
  flexGrid: {
    display: 'flex',
  },
  flexCol: {
    flex: 1,
  },
  button: {
    margin: theme.spacing(1),
  },
  taskControlButtons: {
    marginBottom: theme.spacing(3),
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
})

export interface IProps {
  tasks: ITaskQueueInfo
  restartRateLimitCollection: any
  killAndRestartTweetStreaming: any
  launchTaskFillMissingTweets: any
}

export interface IState {}

type TComponentProps = IProps & WithStyles

class RealTimeTweetStreaming extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { tasks, restartRateLimitCollection, killAndRestartTweetStreaming, launchTaskFillMissingTweets, classes } =
      this.props

    return (
      <React.Fragment>
        <Tooltip title="Restart the rate limit collection task">
          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button, classes.taskControlButtons)}
            onClick={restartRateLimitCollection}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Restart tweet streaming
          </Button>
        </Tooltip>

        <Tooltip title="Kill the restart tweet streaming tasks">
          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button, classes.taskControlButtons)}
            onClick={killAndRestartTweetStreaming}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Kill tweet streaming tasks
          </Button>
        </Tooltip>

        <Tooltip title="Run the fill missing tweets task">
          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button, classes.taskControlButtons)}
            onClick={launchTaskFillMissingTweets}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Run the fill missing tweets task
          </Button>
        </Tooltip>

        <div className={classes.flexGrid}>
          {Object.keys(tasks).map((queueName: string) => (
            <div key={queueName} className={classes.flexCol}>
              <Typography variant="h5" gutterBottom>
                {queueName}
              </Typography>
              {tasks[queueName] !== null &&
                Object.keys(tasks[queueName]).map((registryName: string) => (
                  <React.Fragment key={registryName}>
                    <List
                      component="ul"
                      subheader={<ListSubheader component="div">{registryName}</ListSubheader>}
                      className={classes.root}
                    >
                      {tasks[queueName][registryName].map((task: ITaskInfo) => (
                        <ListItem key={task.id}>
                          <ListItemText primary={task.name} secondary={task.id} />
                        </ListItem>
                      ))}
                    </List>
                  </React.Fragment>
                ))}
            </div>
          ))}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(RealTimeTweetStreaming)
