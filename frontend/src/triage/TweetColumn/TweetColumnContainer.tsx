/* eslint-disable @typescript-eslint/naming-convention */
import { debounce } from 'lodash-es'
import * as React from 'react'
import { connect } from 'react-redux'
import { IReviewerAssignment } from '../../redux/modules/interfaces.reviewers'
import { IStore } from '../../redux/modules/reducer'
import { automaticallyAssignReviewer, getAssignmentsByIds } from '../../redux/modules/reviewers'
import {
  ESocialTweetState,
  fetchTweets,
  getTweetAssignmentsForColumn,
  getTweetsForColumn,
  ISocialTweetAssignments,
  ISocialTweetList,
  setTweetState,
} from '../../redux/modules/social'
import { ITriageColumn } from '../../redux/modules/triage'
import { IProfileColumnPosition, wsChangeUserProfileSettings } from '../../redux/modules/user'
import TweetColumn from './TweetColumn'

// Ref. https://github.com/bvaughn/react-virtualized/blob/master/docs/InfiniteLoader.md
const preFetchThreshold = 15
const minBatchSize = 40
const overscanRowCount = 10

export interface IProps {
  column: ITriageColumn
  onOpenAssigner: any
}

export interface IStoreProps {
  tweet_ids: string[]
  tweets: ISocialTweetList
  tweet_assignments: ISocialTweetAssignments
  assignments: IReviewerAssignment[]
}

export interface IDispatchProps {
  loadMoreRows: any
  onPositionUpdate: any
  onAutomaticallyAssignTweet: any
  onSetTweetState: any
}

export interface IReactVirtualizedIndexes {
  startIndex: number
  stopIndex: number
}

// opts: ListProps["onRowsRendered"]
const mapColumnListPropsToTweetPosition = (opts: any, tweetIds: string[]) => {
  // Ref. onRowsRendered() https://github.com/bvaughn/react-virtualized/blob/master/docs/List.md

  if (tweetIds.length === 0 || opts === null) {
    return null
  }

  const firstTweet = tweetIds[0]
  let firstVisibleTweet = tweetIds[opts.startIndex]
  const pageSizeEstimate = opts.overscanStopIndex + minBatchSize / 2 // (i.e. Take the last tweet that's currently rendered in the column [overscanStopIndex] and add half of the page size that we use to load new tweets as the user scrolls down [minBatchSize])
  const stopTweet =
    tweetIds[pageSizeEstimate] !== undefined ? tweetIds[pageSizeEstimate] : tweetIds[tweetIds.length - 1] // If we're at the end of the available tweets in the column then our stopTweet is just the last tweet in the column

  if (firstVisibleTweet > firstTweet) {
    firstVisibleTweet = firstTweet
  }

  return {
    firstTweet, // The most recent tweet that this column has i nit (i.e. the tweet at the very top of the column)
    firstVisibleTweet, // The tweet that's currently visible at the top of the column
    stopTweet, // The tweet that marks the end of the currently visible column "window" (i.e. this is usually 5 - 10 tweets below the currently visible column window, so in refreshing tweets we can safely stop at this tweet)
  }
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnContainer extends React.Component<TComponentProps, {}> {
  private onPositionUpdate: any

  private onLoadMoreRows: any

  // private rowsLoaderTimeoutId: any

  public constructor(props: TComponentProps) {
    super(props)

    // opts: ListProps["onRowsRendered"]
    this.onPositionUpdate = debounce(
      (columnId: number, opts: any) =>
        this.props.onPositionUpdate(columnId, mapColumnListPropsToTweetPosition(opts, this.props.tweet_ids)),
      2500,
      { maxWait: 2000 }
    )

    // this.onLoadMoreRows = debounce((indexes: IReactVirtualizedIndexes) => this.props.loadMoreRows(indexes), 2500, {
    //   maxWait: 2000,
    // })

    this.onLoadMoreRows = debounce(
      (indexes: IReactVirtualizedIndexes) => {
        this.props.loadMoreRows(indexes)

        // console.log(`this.rowsLoaderTimeoutId was ${this.rowsLoaderTimeoutId}`)
        // if (this.rowsLoaderTimeoutId !== undefined) {
        //   clearTimeout(this.rowsLoaderTimeoutId)
        // }

        // this.rowsLoaderTimeoutId = setTimeout(() => {
        //   delete this.rowsLoaderTimeoutId
        //   this.props.loadMoreRows(indexes)
        // }, 2000)
        // console.log(`this.rowsLoaderTimeoutId is ${this.rowsLoaderTimeoutId}`)
      },
      2500,
      { maxWait: 2000 }
    )
  }

  public render() {
    const {
      column,
      onOpenAssigner,
      tweet_ids,
      tweets,
      tweet_assignments,
      assignments,
      onAutomaticallyAssignTweet,
      onSetTweetState,
    } = this.props

    return (
      <TweetColumn
        column={column}
        onOpenAssigner={onOpenAssigner}
        tweet_ids={tweet_ids}
        tweets={tweets}
        tweet_assignments={tweet_assignments}
        assignments={assignments}
        preFetchThreshold={preFetchThreshold}
        minBatchSize={minBatchSize}
        overscanRowCount={overscanRowCount}
        loadMoreRows={this.onLoadMoreRows}
        onPositionUpdate={this.onPositionUpdate}
        onAutomaticallyAssignTweet={onAutomaticallyAssignTweet}
        onSetTweetState={onSetTweetState}
      />
    )
  }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
  const { triage } = state

  const getTweetsForColumnFilter = getTweetsForColumn(state)

  const getTweetAssignmentsForColumnFilter = getTweetAssignmentsForColumn(state)
  const tweetAssignmentsForColumn = getTweetAssignmentsForColumnFilter(triage.column_tweets[ownProps.column.id])

  const getAssignmentsForColumn = getAssignmentsByIds(state)

  return {
    tweet_ids: triage.column_tweets[ownProps.column.id],
    tweets: getTweetsForColumnFilter(triage.column_tweets[ownProps.column.id]),
    tweet_assignments: tweetAssignmentsForColumn,
    assignments: getAssignmentsForColumn(Object.values(tweetAssignmentsForColumn)),
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps: IProps): IDispatchProps => {
  return {
    loadMoreRows: (indexes: IReactVirtualizedIndexes) => {
      console.log('loadMoreRows')
      return dispatch(fetchTweets(indexes.startIndex, indexes.stopIndex, [ownProps.column.id]))
    },
    onPositionUpdate: (columnId: number, positions: IProfileColumnPosition | null) => {
      if (positions !== null) {
        const settings = { column_positions: {} }
        settings.column_positions[columnId] = positions
        dispatch(wsChangeUserProfileSettings(settings))
      }
    },
    onAutomaticallyAssignTweet: (tweetId: string) => {
      dispatch(automaticallyAssignReviewer(tweetId))
    },
    onSetTweetState: (tweetId: string, tweetState: ESocialTweetState) => {
      dispatch(setTweetState(tweetId, tweetState))
    },
  }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
  mapStateToProps,
  mapDispatchToProps
)(TweetColumnContainer)
