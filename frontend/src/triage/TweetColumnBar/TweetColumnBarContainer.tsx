import * as React from 'react'
import { connect } from 'react-redux'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { IStore } from '../../redux/modules/reducer'
import { getReviewerById } from '../../redux/modules/reviewers'
import {
  assignTriagerToColumn,
  ITriageColumn,
  loadBufferedTweetsForColumn,
  unassignTriagerFromColumn,
} from '../../redux/modules/triage'
import TweetColumnBar from './TweetColumnBar'

export interface IProps {
  column: ITriageColumn
}

export interface IStoreProps {
  hasBufferedTweets: boolean
  assignedToUser: IReviewerUser | undefined
}

export interface IDispatchProps {
  onLoadNewTweetsForColumn: Function
  onAssignTriager: Function
  onUnassignTriager: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnBarContainer extends React.PureComponent<TComponentProps, {}> {
  public render() {
    const { column, hasBufferedTweets, assignedToUser, onLoadNewTweetsForColumn, onAssignTriager, onUnassignTriager } =
      this.props

    return (
      <TweetColumnBar
        column={column}
        hasBufferedTweets={hasBufferedTweets}
        assignedToUser={assignedToUser}
        onLoadNewTweetsForColumn={onLoadNewTweetsForColumn}
        onAssignTriager={onAssignTriager}
        onUnassignTriager={onUnassignTriager}
      />
    )
  }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
  const { triage } = state

  const getReviewerByIdFilter = getReviewerById(state)

  return {
    hasBufferedTweets: triage.column_tweets_buffered[ownProps.column.id].length > 0,
    assignedToUser: getReviewerByIdFilter(ownProps.column.assigned_to),
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
  return {
    onLoadNewTweetsForColumn: (event: React.MouseEvent<HTMLElement>) => {
      if ('columnid' in event.currentTarget.dataset && event.currentTarget.dataset.columnid !== undefined) {
        dispatch(loadBufferedTweetsForColumn(parseInt(event.currentTarget.dataset.columnid, 10)))
      }
    },
    onAssignTriager: (userId: number) => {
      dispatch(assignTriagerToColumn(ownProps.column.id, userId))
    },
    onUnassignTriager: () => {
      dispatch(unassignTriagerFromColumn(ownProps.column.id))
    },
  }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(TweetColumnBarContainer)
