import { LinearProgress } from "@material-ui/core"
import * as React from "react"
import { connect } from "react-redux"
import { IMyWindow } from "../../redux/modules/interfaces"
import { IStore } from "../../redux/modules/reducer"
import RealTimeTweetStreaming from "./RealTimeTweetStreaming"
declare var window: IMyWindow
export interface IProps {}

export interface IStoreProps {}

export interface IDispatchProps {}

export interface IState {
    tasks: ICeleryTasks | null
}

export interface ICeleryTasks {
    running: ICeleryTaskList
    scheduled: ICeleryTaskList
    reserved: ICeleryTaskList
}

export interface ICeleryTaskList {
    [key: string]: ICeleryTaskInfo[]
}

export interface ICeleryTaskInfo {
    id: string
    name: string
    args: string // JSON e.g. "['1086116522517557248']"
    kwargs: string // JSON e.g. "{}"
    type: string
    hostname: string
    time_start: number
    acknowledged: boolean
    delivery_info: {
        exchange: string
        routing_key: string
        priority: number
        redelivered: boolean
    }
    worker_pid: number
}

const getTasks = async (): Promise<any> => {
    const { json } = await window.api.get("/api/0.1/celery_admin/tasks/", null, {})
    return json
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class RealTimeTweetStreamingContainer extends React.PureComponent<TComponentProps, IState> {
    private restartTweetStreaming: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { tasks: null }

        this.restartTweetStreaming = () => window.api.get("/api/0.1/celery_admin/restart_streaming/", null, {})
    }
    public async componentDidMount() {
        this.setState({ tasks: await getTasks() })
    }

    public render() {
        const { tasks } = this.state

        if (tasks === null) {
            return <LinearProgress />
        }

        return <RealTimeTweetStreaming tasks={tasks} restartTweetStreaming={this.restartTweetStreaming} />
    }
}

const mapStateToProps = (state: IStore, ownProps: TComponentProps): IStoreProps => {
    return {}
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RealTimeTweetStreamingContainer)
