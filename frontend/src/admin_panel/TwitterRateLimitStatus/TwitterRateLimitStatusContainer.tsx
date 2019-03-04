import { LinearProgress } from "@material-ui/core"
import * as React from "react"
import { connect } from "react-redux"
import { IMyWindow } from "../../redux/modules/interfaces"
import { IStore } from "../../redux/modules/reducer"
import TwitterRateLimitStatus from "./TwitterRateLimitStatus"
declare var window: IMyWindow
export interface IProps {}

export interface IStoreProps {}

export interface IDispatchProps {}

export interface IState {
    rateLimitStatus: IRateLimitStatus | null
}

export interface IRateLimitStatus {
    resources: {
        application: { [key: string]: IResourceRateLimit }
        statuses: { [key: string]: IResourceRateLimit }
        tweets: { [key: string]: IResourceRateLimit }
        search: { [key: string]: IResourceRateLimit }
    }
}

export interface IResourceRateLimit {
    limit: number
    remaining: number
    reset: number
}

const getRateLimitStatus = async (): Promise<any> => {
    const { json } = await window.api.get("/0.1/twitter_api_admin/rate_limit_status/", null, {})
    return json
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TwitterRateLimitStatusContainer extends React.PureComponent<TComponentProps, IState> {
    public constructor(props: TComponentProps) {
        super(props)

        this.state = { rateLimitStatus: null }
    }
    public async componentDidMount() {
        this.setState({ rateLimitStatus: await getRateLimitStatus() })
    }

    public render() {
        const { rateLimitStatus } = this.state

        if (rateLimitStatus === null) {
            return <LinearProgress />
        }

        return <TwitterRateLimitStatus rateLimitStatus={rateLimitStatus} />
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
)(TwitterRateLimitStatusContainer)
