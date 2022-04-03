import { Typography } from '@material-ui/core'
import * as React from 'react'
import { connect } from 'react-redux'
import { getConsumedTwitterRateLimitResources } from '../../redux/modules/app'
import { IStore } from '../../redux/modules/reducer'
import TwitterRateLimitStatus from './TwitterRateLimitStatus'
import { IRateLimitResources } from './types'

export interface IProps {}

export interface IStoreProps {
  rateLimitResources: IRateLimitResources | null
}

export interface IDispatchProps {}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TwitterRateLimitStatusContainer extends React.Component<TComponentProps, {}> {
  public render() {
    const { rateLimitResources } = this.props

    if (rateLimitResources === null || Object.keys(rateLimitResources).length === 0) {
      return (
        <Typography variant="subtitle1" gutterBottom>
          We haven&lsquo;t used any of our rate limit allowances with Twitter yet.
        </Typography>
      )
    }

    return <TwitterRateLimitStatus rateLimitResources={rateLimitResources} />
  }
}

const mapStateToProps = (state: IStore, _ownProps: IProps): IStoreProps => {
  return { rateLimitResources: getConsumedTwitterRateLimitResources(state) }
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(TwitterRateLimitStatusContainer)
