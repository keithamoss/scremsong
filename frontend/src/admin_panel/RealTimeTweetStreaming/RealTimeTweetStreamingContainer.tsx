import { LinearProgress } from '@material-ui/core'
import * as React from 'react'
import { connect } from 'react-redux'
import { IMyWindow } from '../../redux/modules/interfaces'
import { IStore } from '../../redux/modules/reducer'
import RealTimeTweetStreaming from './RealTimeTweetStreaming'
import { ITaskQueueInfo } from './types'

// eslint-disable-next-line no-var
declare var window: IMyWindow

export interface IProps {}

export interface IStoreProps {
  isMuzzled: boolean
}

export interface IDispatchProps {}

export interface IState {
  tasks: ITaskQueueInfo | null
}

const getTasks = async (): Promise<any> => {
  const { json } = await window.api.get('/0.1/task_admin/tasks/', null, {})
  return json
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class RealTimeTweetStreamingContainer extends React.PureComponent<TComponentProps, IState> {
  private restartRateLimitCollection: any

  private killAndRestartTweetStreaming: any

  private launchTaskFillMissingTweets: any

  private refreshTasksInfo: any

  private toggleMuzzledMode: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { tasks: null }

    this.restartRateLimitCollection = () =>
      window.api.get('/0.1/task_admin/restart_rate_limit_collection_task/', null, {})
    this.killAndRestartTweetStreaming = () =>
      window.api.get('/0.1/task_admin/kill_and_restart_streaming_tasks/', null, {})
    this.launchTaskFillMissingTweets = () =>
      window.api.get('/0.1/task_admin/launch_task_fill_missing_tweets_task/', null, {})
    this.refreshTasksInfo = async () => this.setState({ tasks: await getTasks() })
    this.toggleMuzzledMode = () => window.api.get('/0.1/social_auth/toggle_muzzled_mode/', null, {})
  }

  public async componentDidMount() {
    this.setState({ tasks: await getTasks() })
  }

  public render() {
    const { isMuzzled } = this.props
    const { tasks } = this.state

    if (tasks === null) {
      return <LinearProgress />
    }

    return (
      <RealTimeTweetStreaming
        tasks={tasks}
        restartRateLimitCollection={this.restartRateLimitCollection}
        killAndRestartTweetStreaming={this.killAndRestartTweetStreaming}
        launchTaskFillMissingTweets={this.launchTaskFillMissingTweets}
        refreshTasksInfo={this.refreshTasksInfo}
        isMuzzled={isMuzzled}
        toggleMuzzledMode={this.toggleMuzzledMode}
      />
    )
  }
}

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  const { app } = state

  return { isMuzzled: app.socialplatform_settings['SocialPlatformChoice.TWITTER'].muzzled }
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(RealTimeTweetStreamingContainer)
