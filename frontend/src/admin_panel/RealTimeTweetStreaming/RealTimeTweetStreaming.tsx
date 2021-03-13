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
import { ICeleryTaskInfo, ICeleryTasks } from './types'

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
  tasks: ICeleryTasks
  restartTweetStreaming: any
  killTweetStreaming: any
}

export interface IState {}

type TComponentProps = IProps & WithStyles

class RealTimeTweetStreaming extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { tasks, restartTweetStreaming, killTweetStreaming, classes } = this.props

    return (
      <React.Fragment>
        <Tooltip title="Restart the real-time tweet streaming worker process">
          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button, classes.taskControlButtons)}
            onClick={restartTweetStreaming}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Restart tweet streaming
          </Button>
        </Tooltip>

        <Tooltip title="Kill the real-time tweet streaming tasks">
          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button, classes.taskControlButtons)}
            onClick={killTweetStreaming}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Kill tweet streaming tasks
          </Button>
        </Tooltip>

        <div className={classes.flexGrid}>
          {Object.keys(tasks).map((taskCategory: string) => (
            <div key={taskCategory} className={classes.flexCol}>
              <Typography variant="h5" gutterBottom>
                {taskCategory}
              </Typography>
              {tasks[taskCategory] !== null &&
                Object.keys(tasks[taskCategory]).map((workerName: string) => (
                  <React.Fragment key={workerName}>
                    <List
                      component="ul"
                      subheader={<ListSubheader component="div">{workerName}</ListSubheader>}
                      className={classes.root}
                    >
                      {tasks[taskCategory][workerName].map((task: ICeleryTaskInfo) => (
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
