import { IconButton, IconMenu, MenuItem } from "material-ui"
import { ActionAssignment, ActionAssignmentInd, NavigationClose } from "material-ui/svg-icons"
import * as React from "react"
import Tweet from "react-tweet"
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from "react-virtualized"
import "react-virtualized/styles.css"
import styled from "styled-components"

const Column = styled.div`
    width: 370px;
    height: 100%;
    margin: 5px;
`

const ColumnHeading = styled.h3`
    margin-top: 8px;
`

export interface IProps {
    column: any
    tweet_ids: string[]
    tweets: any[]
    reviewers: object
    loadMoreRows: any
    assignTweet: any
    dismissTweet: any
}

export class TweetColumn extends React.Component<IProps, {}> {
    private dismissTweet: any

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

    public constructor(props: any) {
        super(props)
        this.dismissTweet = (tweetId: any) => () => this.props.dismissTweet(tweetId)
    }

    public render() {
        const { column, tweet_ids, loadMoreRows } = this.props

        return (
            <Column>
                <ColumnHeading>
                    {column.search_phrases.join(", ")} (#
                    {column.id})
                </ColumnHeading>

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
            </Column>
        )
    }

    public componentDidUpdate(prevProps: any, prevState: any) {
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
    }

    private _isRowLoaded = ({ index }: any) => {
        return index < this.props.tweet_ids.length
    }

    private _rowRenderer = ({ index, isScrolling, isVisible, key, parent, style }: any) => {
        const { column, tweet_ids, tweets, reviewers } = this.props

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
                tweetStyle = { ...tweetStyle, backgroundColor: "grey" }
            }
            if ("review_status" in tweets[tweetId] && tweets[tweetId].review_status === "SocialAssignmentStatus.DONE") {
                tweetStyle = { ...tweetStyle, backgroundColor: "lightgreen" }
            }

            return (
                <CellMeasurer key={key} cache={this._cache} columnIndex={0} parent={parent} rowIndex={index}>
                    <div style={tweetStyle}>
                        <Tweet key={tweetId} data={tweets[tweetId].data} />
                        <div>
                            <IconMenu
                                iconButtonElement={
                                    <IconButton tooltip="Assign this tweet to a reviewer">
                                        {!("reviewer_id" in tweets[tweetId]) && <ActionAssignment />}
                                        {"reviewer_id" in tweets[tweetId] && <ActionAssignmentInd />}
                                    </IconButton>
                                }
                                anchorOrigin={{ horizontal: "left", vertical: "top" }}
                                targetOrigin={{ horizontal: "left", vertical: "top" }}
                                onItemClick={this.props.assignTweet}
                            >
                                {"reviewer_id" in tweets[tweetId] && <MenuItem primaryText={<em>Unassign</em>} data-tweetid={tweetId} />}
                                {Object.keys(reviewers).map((reviewerId: any) => {
                                    const reviewer = reviewers[reviewerId]
                                    let primaryText = reviewer.name
                                    if ("reviewer_id" in tweets[tweetId] && tweets[tweetId].reviewer_id === reviewer.id) {
                                        primaryText += " (Assigned)"
                                    }
                                    return (
                                        <MenuItem
                                            key={reviewer.id}
                                            primaryText={primaryText}
                                            data-reviewerid={reviewer.id}
                                            data-tweetid={tweetId}
                                        />
                                    )
                                })}
                            </IconMenu>
                            <IconButton tooltip="Dismiss and hide this tweet" onClick={this.dismissTweet(tweetId)}>
                                <NavigationClose />
                            </IconButton>
                        </div>
                    </div>
                </CellMeasurer>
            )
        }
    }

    private _setListRef = (ref: any) => {
        this._list = ref
    }
}

export default TweetColumn
