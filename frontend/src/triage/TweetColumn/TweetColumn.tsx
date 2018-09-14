import { IconButton } from "material-ui"
import { ActionAssignment, NavigationClose } from "material-ui/svg-icons"
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
    loadMoreRows: any
    assignTweet: any
    dismissTweet: any
}

export class TweetColumn extends React.Component<IProps, {}> {
    private assignTweet: any
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
        this.assignTweet = (tweetId: any) => () => this.props.assignTweet(tweetId)
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
        const { column, tweet_ids, tweets } = this.props

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
            return (
                <CellMeasurer key={key} cache={this._cache} columnIndex={0} parent={parent} rowIndex={index}>
                    <div style={style}>
                        <Tweet key={tweetId} data={tweets[tweetId]} />
                        <div>
                            <IconButton tooltip="Assign this tweet to a reviewer" onClick={this.assignTweet(tweetId)}>
                                <ActionAssignment />
                            </IconButton>
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
