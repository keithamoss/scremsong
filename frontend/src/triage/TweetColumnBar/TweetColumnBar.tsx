import { AppBar, IconButton, Toolbar, Tooltip, Typography, withStyles, WithStyles } from "@material-ui/core"
import { lightBlue } from "@material-ui/core/colors"
import NewReleases from "@material-ui/icons/NewReleases"
import NewReleasesOutlined from "@material-ui/icons/NewReleasesOutlined"
import * as React from "react"
import { ITriageColumn } from "../../redux/modules/triage"

const styles = () => ({
    grow: {
        flexGrow: 1,
    },
    newTweetsBright: {
        color: lightBlue[500],
    },
})

export interface IProps {
    column: ITriageColumn
    hasBufferedTweets: boolean
    onLoadNewTweetsForColumn: any
}

export interface IState {}

type TComponentProps = IProps & WithStyles
class TweetColumnBar extends React.PureComponent<TComponentProps, IState> {
    public render() {
        const { column, hasBufferedTweets, onLoadNewTweetsForColumn, classes } = this.props

        return (
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {column.search_phrases.join(", ")} (#
                        {column.id})
                    </Typography>
                    {hasBufferedTweets === false && (
                        <IconButton className={classes.newTweetsBright} disabled={true}>
                            <NewReleasesOutlined />
                        </IconButton>
                    )}
                    {hasBufferedTweets === true && (
                        <Tooltip title="There are new tweets in this column - click to show them" aria-label="This column has new tweets">
                            <IconButton className={classes.newTweetsBright} onClick={onLoadNewTweetsForColumn} data-columnid={column.id}>
                                <NewReleases />
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
            </AppBar>
        )
    }
}

export default withStyles(styles)(TweetColumnBar)
