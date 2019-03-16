import * as React from "react"
import { connect } from "react-redux"
import { getConsumedTwitterRateLimitResources } from "../../redux/modules/app"
import { IStore } from "../../redux/modules/reducer"
import TwitterRateLimitStatus from "./TwitterRateLimitStatus"

export interface IProps {}

export interface IStoreProps {
    rateLimitResources: IRateLimitResources | null
}

export interface IDispatchProps {}

export interface IRateLimitResources {
    [key: string]: IRateLimitResourcesSet
}

export interface IRateLimitResourcesSet {
    [key: string]: IResourceRateLimit
}

export interface IResourceRateLimit {
    limit: number
    remaining: number
    reset: number
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TwitterRateLimitStatusContainer extends React.Component<TComponentProps, {}> {
    public render() {
        const { rateLimitResources } = this.props

        if (rateLimitResources === null) {
            return null
        }

        return <TwitterRateLimitStatus rateLimitResources={rateLimitResources} />
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    return { rateLimitResources: getConsumedTwitterRateLimitResources(state) }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TwitterRateLimitStatusContainer)
