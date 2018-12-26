import { Button, Divider, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import AssignmentIcon from "@material-ui/icons/Assignment"
import DeleteIcon from "@material-ui/icons/Delete"
import * as React from "react"
import Tweet from "react-tweet"
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from "react-virtualized"
import "react-virtualized/styles.css"
import { eSocialAssignmentStatus, IReviewerAssignment } from "../../redux/modules/reviewers"
import { ISocialTweetAssignments, ISocialTweetList } from "../../redux/modules/social"
import { ITriageColumn } from "../../redux/modules/triage"
import { getColumnPosition } from "../../redux/modules/user"

const styles = (theme: Theme) => ({
    actionBar: {},
    button: {
        margin: theme.spacing.unit,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
    },
})

export interface IProps {
    column: ITriageColumn
    onOpenAssigner: any
    tweet_ids: string[]
    tweets: ISocialTweetList
    tweet_assignments: ISocialTweetAssignments
    assignments: IReviewerAssignment[]
    preFetchThreshold: number
    minBatchSize: number
    overscanRowCount: number
    loadMoreRows: any
    onPositionUpdate: any
    onDismissTweet: any
}

export interface IState {
    ready: boolean
    firstVisibleTweet?: string
}

export interface ISnapshot {
    lastStartTweet: string
}

type TComponentProps = IProps & WithStyles
class TweetColumn extends React.Component<TComponentProps, IState> {
    private onOpenAssigner: Function
    private onDismissTweet: Function
    private _registerChild: Function
    private _noRowsRenderer: any
    private _list: List | undefined
    private _onRowsRendered: Function
    private _firstVisibleTweet?: string

    private _cache = new CellMeasurerCache({
        defaultHeight: 175,
        // defaultWidth: 370,
        // minWidth: 370,
        fixedWidth: true,
        keyMapper: (rowIndex: number) => {
            return this.props.tweet_ids[rowIndex]
        },
    })

    public constructor(props: TComponentProps, state: IState) {
        super(props)

        this.state = { ready: false }

        this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => () => this.props.onOpenAssigner(tweetId, assignmentId)
        this.onDismissTweet = (tweetId: string) => () => this.props.onDismissTweet(tweetId)

        this._onRowsRendered = (onRowsRendered: Function, opts: any /*ListProps["onRowsRendered"]*/) => {
            if (this.state.ready === true) {
                // console.log("_onRowsRendered", this.props.column.id)
                this.props.onPositionUpdate(this.props.column.id, opts)
                // We store it in the class rather than React state so we can avoid triggering the React update lifecycle
                this._firstVisibleTweet = this.props.tweet_ids[opts.startIndex]
            }
            onRowsRendered(opts)
        }

        this._registerChild = (registerChild: Function, ref: any) => {
            this._setListRef(ref)
            registerChild(ref)
        }

        this._noRowsRenderer = () => {
            const { ready } = this.state
            if (ready === false) {
                return <div>Loading...</div>
            }
            return <div>No rows found!</div>
        }
    }

    public render() {
        const { column, tweet_ids, preFetchThreshold, minBatchSize, overscanRowCount, loadMoreRows } = this.props
        const { ready } = this.state

        if (tweet_ids.length === 0) {
            return null
        }

        return (
            <InfiniteLoader
                isRowLoaded={this._isRowLoaded}
                loadMoreRows={loadMoreRows}
                rowCount={column.total_tweets}
                threshold={preFetchThreshold}
                minimumBatchSize={minBatchSize}
            >
                {({ onRowsRendered, registerChild }) => (
                    <AutoSizer>
                        {({ height, width }) => {
                            return (
                                <List
                                    deferredMeasurementCache={this._cache}
                                    width={width}
                                    height={height}
                                    noRowsRenderer={this._noRowsRenderer}
                                    onRowsRendered={this._onRowsRendered.bind(this, onRowsRendered)}
                                    overscanRowCount={overscanRowCount}
                                    ref={this._registerChild.bind(this, registerChild)}
                                    rowCount={ready === true ? column.total_tweets : 0}
                                    rowHeight={this._cache.rowHeight}
                                    rowRenderer={this._rowRenderer}
                                    scrollToAlignment={"start"}
                                />
                            )
                        }}
                    </AutoSizer>
                )}
            </InfiniteLoader>
        )
    }

    public shouldComponentUpdate(nextProps: TComponentProps, nextState: object, nextContext: any): boolean {
        if (this.state !== nextState) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "State differs")
            return true
        }

        if (this.props.tweet_ids.length !== nextProps.tweet_ids.length) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_ids.length")
            return true
        }

        if (this.props.tweet_assignments.length !== nextProps.tweet_assignments.length) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_assignments.length")
            return true
        }

        if (this.props.tweet_ids !== nextProps.tweet_ids) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_ids")
            return true
        }

        if (this.props.tweet_assignments !== nextProps.tweet_assignments) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_assignments")
            return true
        }

        if (this.props.assignments !== nextProps.assignments) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "assignments")
            return true
        }

        if (this.props.column !== nextProps.column) {
            // console.log(`shouldComponentUpdate ${this.props.column.id}`, "column")
            return true
        }

        // console.log(`shouldComponentUpdate ${this.props.column.id}`, "All checks exhausted, don't update")
        return false
    }

    public async componentDidMount() {
        const position = await getColumnPosition(this.props.column.id)
        // console.log("componentDidMount", this.props.column.id, position)

        if (position !== null) {
            this.setState({ ready: true, firstVisibleTweet: position.firstVisibleTweet }, () => {
                const tweetIndex = this.props.tweet_ids.findIndex((tweetId: string) => tweetId === this.state.firstVisibleTweet)
                if (this._list !== undefined && tweetIndex !== -1) {
                    this._list.scrollToRow(tweetIndex)
                }
            })
        } else {
            this.setState({ ready: true })
        }
    }

    public getSnapshotBeforeUpdate(prevProps: TComponentProps, prevState: IState): ISnapshot | null {
        if (this.state.ready === true && this._firstVisibleTweet !== undefined) {
            // console.log("getSnapshotBeforeUpdate", this.props.column.id)
            return { lastStartTweet: this._firstVisibleTweet }
        }
        return null
    }

    public componentDidUpdate(prevProps: IProps, prevState: IState, snapshot: ISnapshot) {
        if (this.props.tweet_ids !== prevProps.tweet_ids) {
            let index

            // We've added some tweets to the end, so reset from the last index forward
            if (this.props.tweet_ids[this.props.tweet_ids.length - 1] !== prevProps.tweet_ids[prevProps.tweet_ids.length - 1]) {
                index = prevProps.tweet_ids.length
            } else {
                // Then assume we've added tweets at the start and reset everything
                index = 0
            }

            // We don't need to do this because we don't display any placeholders
            // this._cache.clear(index, 0)

            if (this._list) {
                this._list.recomputeRowHeights(index)
            }
        }

        if (
            this.state.ready === true &&
            this._list &&
            this.props.tweet_ids !== prevProps.tweet_ids &&
            snapshot !== null &&
            snapshot.lastStartTweet !== undefined
        ) {
            // We only need to update if tweets got added to the top of the list. To allow for tweets to appear anywhere above our
            // first visible tweet we'll check it's index
            const oldTweetIndex = prevProps.tweet_ids.findIndex((tweetId: string) => tweetId === snapshot.lastStartTweet)
            const tweetIndex = this.props.tweet_ids.findIndex((tweetId: string) => tweetId === snapshot.lastStartTweet)
            if (tweetIndex !== -1 && oldTweetIndex !== tweetIndex) {
                // console.log("Move ", this.props.column.id, " to ", tweetIndex, " for ", snapshot.lastStartTweet)
                this._list.scrollToRow(tweetIndex)
            }
        }
    }

    private _isRowLoaded = ({ index }: any) => {
        return index < this.props.tweet_ids.length
    }

    private _rowRenderer = ({ index, isScrolling, isVisible, key, parent, style }: any) => {
        const { column, tweet_ids, tweets, tweet_assignments, assignments, classes } = this.props

        if (index >= column.total_tweets) {
            return (
                <div key={key} style={style}>
                    Fin.
                </div>
            )
        } else if (index >= tweet_ids.length) {
            return (
                <div key={key} style={style}>
                    Loading some more tweets...
                </div>
            )
        } else {
            const tweetId = tweet_ids[index]

            let tweetStyle = style
            if (tweets[tweetId].is_dismissed) {
                tweetStyle = { ...tweetStyle, backgroundColor: "lightgrey" }
            }

            let assignment: IReviewerAssignment | null = null
            let assignmentId = null
            if (tweetId in tweet_assignments) {
                assignmentId = tweet_assignments[tweetId]
                assignment = assignments[assignmentId]
                if (assignment.status === eSocialAssignmentStatus.PENDING) {
                    tweetStyle = { ...tweetStyle, backgroundColor: "lightyellow" }
                } else if (assignment.status === eSocialAssignmentStatus.DONE) {
                    tweetStyle = { ...tweetStyle, backgroundColor: "lightgreen" }
                }
            }

            return (
                <CellMeasurer key={key} cache={this._cache} columnIndex={0} parent={parent} rowIndex={index}>
                    <div style={tweetStyle}>
                        <Tweet key={tweetId} data={tweets[tweetId].data} linkProps={{ target: "_blank", rel: "noreferrer" }} />
                        <Divider />
                        <div className={classes.actionBar}>
                            <Button
                                color="primary"
                                className={classes.button}
                                aria-label="Assign tweet"
                                onClick={this.onOpenAssigner(tweetId, assignmentId)}
                            >
                                Assign
                                <AssignmentIcon className={classes.rightIcon} />
                            </Button>

                            <Tooltip title="Dismiss and hide this tweet" aria-label="Dismiss tweet">
                                <Button className={classes.button} aria-label="Dismiss tweet" onClick={this.onDismissTweet(tweetId)}>
                                    Dismiss
                                    <DeleteIcon className={classes.rightIcon} />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CellMeasurer>
            )
        }
    }

    private _setListRef = (ref: List) => {
        this._list = ref
    }
}

// @ts-ignore
export default withStyles(styles)(TweetColumn)
