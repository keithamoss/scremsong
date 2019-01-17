import { Button, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import AssignmentIcon from "@material-ui/icons/Assignment"
import AssignmentOutlinedIcon from "@material-ui/icons/AssignmentOutlined"
import BlockOutlinedIcon from "@material-ui/icons/BlockOutlined"
import CheckCircleOutlinedIcon from "@material-ui/icons/CheckCircleOutlined"
import LiveTvOutlinedIcon from "@material-ui/icons/LiveTvOutlined"
import * as React from "react"
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from "react-virtualized"
import "react-virtualized/styles.css"
import { eSocialAssignmentStatus, IReviewerAssignment } from "../../redux/modules/reviewers"
import { eSocialTweetState, ISocialTweetAssignments, ISocialTweetList } from "../../redux/modules/social"
import { getActionBarBackgroundColour, ITriageColumn } from "../../redux/modules/triage"
import { getColumnPosition } from "../../redux/modules/user"
import TweetCardContainer from "../../twitter/TweetCard/TweetCardContainer"

const styles = (theme: Theme) => ({
    actionBar: { width: 50, height: "100%", display: "inline-block", verticalAlign: "top" },
    button: {
        minWidth: 50,
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
    onSetTweetState: any
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
    private onSetTweetState: Function
    private _registerChild: Function
    private _noRowsRenderer: any
    private _list: List | undefined
    private _onRowsRendered: Function
    private _firstVisibleTweet?: string

    private _cache = new CellMeasurerCache({
        defaultHeight: 175,
        // defaultWidth: 420,
        // minWidth: 420,
        fixedWidth: true,
        keyMapper: (rowIndex: number) => {
            return this.props.tweet_ids[rowIndex]
        },
    })

    public constructor(props: TComponentProps, state: IState) {
        super(props)

        this.state = { ready: false }

        this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => () => this.props.onOpenAssigner(tweetId, assignmentId)
        this.onSetTweetState = (tweetId: string, tweetState: eSocialTweetState) => () => this.props.onSetTweetState(tweetId, tweetState)

        this._onRowsRendered = (onRowsRendered: Function, opts: any /*ListProps["onRowsRendered"]*/) => {
            if (this.state.ready === true) {
                // console.log("_onRowsRendered", this.props.column.id)
                this.props.onPositionUpdate(this.props.column.id, opts)
                // We store it in the class rather than React state so we can avoid triggering the React update lifecycle
                this._firstVisibleTweet = this.props.tweet_ids[opts.startIndex]
                // if (this.props.column.id === 6) {
                //     console.log(`oRR: _firstVisibleTweet is ${this._firstVisibleTweet}`)
                //     console.log("oRR:", opts)
                // }
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
            this.props.onPositionUpdate(this.props.column.id, null)
            return <div>This column has no tweets!</div>
        }
    }

    public render() {
        const { column, tweet_ids, preFetchThreshold, minBatchSize, overscanRowCount, loadMoreRows } = this.props
        const { ready } = this.state

        if (tweet_ids.length === 0 && ready === false) {
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
        // Now that we need to reflect changes to tweet.state we always need to re-render the component
        return true

        // if (this.state !== nextState) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "State differs")
        //     return true
        // }

        // if (this.props.tweet_ids.length !== nextProps.tweet_ids.length) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_ids.length")
        //     return true
        // }

        // if (this.props.tweet_assignments.length !== nextProps.tweet_assignments.length) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_assignments.length")
        //     return true
        // }

        // if (this.props.tweet_ids !== nextProps.tweet_ids) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_ids")
        //     return true
        // }

        // if (this.props.tweet_assignments !== nextProps.tweet_assignments) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "tweet_assignments")
        //     return true
        // }

        // if (this.props.assignments !== nextProps.assignments) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "assignments")
        //     return true
        // }

        // if (this.props.column !== nextProps.column) {
        //     // console.log(`shouldComponentUpdate ${this.props.column.id}`, "column")
        //     return true
        // }

        // // console.log(`shouldComponentUpdate ${this.props.column.id}`, "All checks exhausted, don't update")
        // return false
    }

    public async componentDidMount() {
        const position = await getColumnPosition(this.props.column.id)
        // console.log("componentDidMount", this.props.column.id, position)

        if (position !== null) {
            this.setState({ ready: true, firstVisibleTweet: position.firstVisibleTweet }, () => {
                const tweetIndex = this.props.tweet_ids.findIndex((tweetId: string) => tweetId === this.state.firstVisibleTweet)
                if (this._list !== undefined && tweetIndex !== -1) {
                    // if (this.props.column.id === 6) {
                    //     console.log("cDM: Move ", this.props.column.id, " to ", tweetIndex, " for ", position.firstVisibleTweet)
                    // }
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
            // if (this.props.column.id === 6) {
            //     console.log("cDU: Move ", this.props.column.id, " to ", tweetIndex, " for ", snapshot.lastStartTweet)
            // }
            if (tweetIndex !== -1 && oldTweetIndex !== tweetIndex) {
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
        } else if (index >= tweet_ids.length && tweet_ids.length < column.total_tweets) {
            return null
        } else {
            const tweetId = tweet_ids[index]
            const tweet = tweets[tweetId]
            const assignmentId = tweet_assignments[tweetId]
            const assignment = tweetId in tweet_assignments ? assignments[assignmentId] : null

            const showActionBarButtons =
                assignment === null || assignment.status === eSocialAssignmentStatus.PENDING || eSocialAssignmentStatus.AWAIT_REPLY
            const backgroundColor = getActionBarBackgroundColour(tweet, assignment)

            let opacity = 1
            if (tweet.state === eSocialTweetState.DISMISSED) {
                opacity = 0.4
            }

            return (
                <CellMeasurer key={key} cache={this._cache} columnIndex={0} parent={parent} rowIndex={index}>
                    {({ measure }) => (
                        <div style={style}>
                            <div className={classes.actionBar} style={{ borderRight: `6px solid ${backgroundColor}` }}>
                                {showActionBarButtons === true && tweet.state === eSocialTweetState.ACTIVE && (
                                    <Tooltip title="Assign this tweet to someone" aria-label="Assign tweet">
                                        <Button
                                            size="small"
                                            className={classes.button}
                                            aria-label="Assign tweet"
                                            onClick={this.onOpenAssigner(tweetId, assignmentId)}
                                        >
                                            {assignmentId === undefined ? <AssignmentOutlinedIcon /> : <AssignmentIcon />}
                                        </Button>
                                    </Tooltip>
                                )}

                                {showActionBarButtons === true && tweet.state === eSocialTweetState.ACTIVE && (
                                    <React.Fragment>
                                        <Tooltip title="Ignore this tweet" aria-label="Ignore tweet">
                                            <Button
                                                size="small"
                                                className={classes.button}
                                                aria-label="Ignore tweet"
                                                onClick={this.onSetTweetState(tweetId, eSocialTweetState.DISMISSED)}
                                            >
                                                <BlockOutlinedIcon />
                                            </Button>
                                        </Tooltip>

                                        <Tooltip title="Mark this tweet as dealt with" aria-label="Deal with tweet">
                                            <Button
                                                size="small"
                                                className={classes.button}
                                                aria-label="Deal with tweet"
                                                onClick={this.onSetTweetState(tweetId, eSocialTweetState.DEALT_WITH)}
                                            >
                                                <CheckCircleOutlinedIcon />
                                            </Button>
                                        </Tooltip>
                                    </React.Fragment>
                                )}

                                {showActionBarButtons === true &&
                                    (tweet.state === eSocialTweetState.DISMISSED || tweet.state === eSocialTweetState.DEALT_WITH) && (
                                        <Tooltip
                                            title="Make this tweet active again (i.e. unignore it, mark it as 'not dealt with')"
                                            aria-label="Set active"
                                        >
                                            <Button
                                                size="small"
                                                className={classes.button}
                                                aria-label="Set active"
                                                onClick={this.onSetTweetState(tweetId, eSocialTweetState.ACTIVE)}
                                            >
                                                <LiveTvOutlinedIcon />
                                            </Button>
                                        </Tooltip>
                                    )}
                            </div>
                            <TweetCardContainer
                                tweetId={tweetId}
                                tweetStyles={{ display: "inline", opacity }}
                                onMediaLoad={measure}
                                onMediaLoadError={measure}
                            />
                        </div>
                    )}
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
