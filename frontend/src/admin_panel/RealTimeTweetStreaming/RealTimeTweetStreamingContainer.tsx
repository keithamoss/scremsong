import { LinearProgress } from '@material-ui/core'
import * as React from 'react'
import { connect } from 'react-redux'
import { IMyWindow } from '../../redux/modules/interfaces'
import { IStore } from '../../redux/modules/reducer'
import RealTimeTweetStreaming from './RealTimeTweetStreaming'
import { ICeleryTasks } from './types'

// eslint-disable-next-line no-var
declare var window: IMyWindow

export interface IProps {}

export interface IStoreProps {}

export interface IDispatchProps {}

export interface IState {
  tasks: ICeleryTasks | null
}

const getTasks = async (): Promise<any> => {
  const { json } = await window.api.get('/0.1/celery_admin/tasks/', null, {})
  return json
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class RealTimeTweetStreamingContainer extends React.PureComponent<TComponentProps, IState> {
  private restartTweetStreaming: any

  private killAndRestartTweetStreaming: any

  private launchTaskFillMissingTweets: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { tasks: null }

    this.restartTweetStreaming = () => window.api.get('/0.1/celery_admin/restart_streaming/', null, {})
    this.killAndRestartTweetStreaming = () =>
      window.api.get('/0.1/celery_admin/kill_and_restart_streaming_tasks/', null, {})
    this.launchTaskFillMissingTweets = () =>
      window.api.get('/0.1/celery_admin/launch_task_fill_missing_tweets/', null, {})
  }

  public async componentDidMount() {
    this.setState({ tasks: await getTasks() })
  }

  public render() {
    const { tasks } = this.state

    if (tasks === null) {
      return <LinearProgress />
    }

    return (
      <RealTimeTweetStreaming
        tasks={tasks}
        restartTweetStreaming={this.restartTweetStreaming}
        killAndRestartTweetStreaming={this.killAndRestartTweetStreaming}
        launchTaskFillMissingTweets={this.launchTaskFillMissingTweets}
      />
    )
  }
}

const mapStateToProps = (_state: IStore, _ownProps: TComponentProps): IStoreProps => {
  return {}
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(RealTimeTweetStreamingContainer)
