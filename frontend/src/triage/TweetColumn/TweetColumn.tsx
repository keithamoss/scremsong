import { Button, Divider, Theme, Tooltip, withStyles } from "@material-ui/core"
import AssignmentIcon from "@material-ui/icons/Assignment"
import DeleteIcon from "@material-ui/icons/Delete"
import * as React from "react"
import Tweet from "react-tweet"
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from "react-virtualized"
import "react-virtualized/styles.css"
import { eSocialAssignmentStatus, IReviewerAssignment, IReviewerUser } from "../../redux/modules/reviewers"
import { ISocialTweetAssignments, ISocialTweetList } from "../../redux/modules/social"
import { ITriageColumn } from "../../redux/modules/triage"

const styles = (theme: Theme) => ({
    button: {
        margin: theme.spacing.unit,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
    },
    column: {
        width: "370px",
        height: "100%",
        margin: "5px",
    },
    columnHeading: {
        marginTop: "8px",
    },
})

export interface IProps {
    column: ITriageColumn
    onOpenAssigner: any
    tweet_ids: string[]
    tweets: ISocialTweetList
    tweet_assignments: ISocialTweetAssignments
    reviewers: IReviewerUser[]
    assignments: IReviewerAssignment[]
    loadMoreRows: any
    onDismissTweet: any
    classes: any
}

export class TweetColumn extends React.Component<IProps, {}> {
    private onDismissTweet: any
    private onOpenAssigner: any

    private _cache = new CellMeasurerCache({
        defaultHeight: 175,
        // defaultWidth: 370,
        // minWidth: 370,
        fixedWidth: true,
        keyMapper: (rowIndex: number) => {
            return this.props.tweet_ids[rowIndex]
        },
    })

    private _list: any

    public constructor(props: IProps) {
        super(props)

        this.onOpenAssigner = (tweetId: string, assignment: IReviewerAssignment | null) => () =>
            this.props.onOpenAssigner(tweetId, assignment)
        this.onDismissTweet = (tweetId: string) => () => this.props.onDismissTweet(tweetId)
    }

    public render() {
        const { column, tweet_ids, loadMoreRows, classes } = this.props

        return (
            <div className={classes.column}>
                <div className={classes.columnHeading}>
                    {column.search_phrases.join(", ")} (#
                    {column.id})
                </div>

                {tweet_ids.length > 0 && (
                    <InfiniteLoader
                        isRowLoaded={this._isRowLoaded}
                        loadMoreRows={loadMoreRows}
                        rowCount={column.total_tweets}
                        threshold={5}
                        minimumBatchSize={20}
                    >
                        {({ onRowsRendered, registerChild }) => (
                            <AutoSizer>
                                {({ height, width }) => {
                                    return (
                                        <List
                                            deferredMeasurementCache={this._cache}
                                            width={width}
                                            height={height}
                                            onRowsRendered={onRowsRendered}
                                            overscanRowCount={1}
                                            ref={this._setListRef}
                                            rowCount={column.total_tweets}
                                            rowHeight={this._cache.rowHeight}
                                            rowRenderer={this._rowRenderer}
                                        />
                                    )
                                }}
                            </AutoSizer>
                        )}
                    </InfiniteLoader>
                )}
            </div>
        )
    }

    public componentDidUpdate(prevProps: IProps, prevState: IProps) {
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
        } else if (JSON.stringify(this.props.reviewers) !== JSON.stringify(prevProps.reviewers)) {
            // Trigger an update if a property of one of our reviewers has changed (e.g. they've gone offline)
            if (this._list) {
                this._list.recomputeRowHeights(0)
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
            if (tweetId in tweet_assignments) {
                const assignmentId = tweet_assignments[tweetId]
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
                        <Tweet key={tweetId} data={tweets[tweetId].data} />
                        <Divider />
                        <Button
                            color="primary"
                            className={classes.button}
                            aria-label="Assign tweet"
                            onClick={this.onOpenAssigner(tweetId, assignment)}
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
                </CellMeasurer>
            )
        }
    }

    private _setListRef = (ref: any) => {
        this._list = ref
    }
}

export default withStyles(styles)(TweetColumn)
