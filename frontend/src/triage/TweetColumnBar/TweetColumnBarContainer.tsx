import * as React from "react"
import { connect } from "react-redux"
import { IStore } from "../../redux/modules/reducer"
import { ITriageColumn, loadBufferedTweetsForColumn } from "../../redux/modules/triage"
import TweetColumnBar from "./TweetColumnBar"

export interface IProps {
    column: ITriageColumn
}

export interface IStoreProps {
    hasBufferedTweets: boolean
}

export interface IDispatchProps {
    onLoadNewTweetsForColumn: Function
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class TweetColumnBarContainer extends React.PureComponent<TComponentProps, {}> {
    public render() {
        const { column, hasBufferedTweets, onLoadNewTweetsForColumn } = this.props

        return <TweetColumnBar column={column} hasBufferedTweets={hasBufferedTweets} onLoadNewTweetsForColumn={onLoadNewTweetsForColumn} />
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IStoreProps => {
    const { triage } = state

    return {
        hasBufferedTweets: triage.column_tweets_buffered[ownProps.column.id].length > 0,
    }
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {
        onLoadNewTweetsForColumn: (event: React.SyntheticEvent<HTMLButtonElement>) => {
            if ("columnid" in event.currentTarget.dataset && event.currentTarget.dataset.columnid !== undefined) {
                dispatch(loadBufferedTweetsForColumn(parseInt(event.currentTarget.dataset.columnid, 10)))
            }
        },
    }
}

export default connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TweetColumnBarContainer)
