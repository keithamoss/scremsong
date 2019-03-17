import { AppBar, IconButton, Theme, Toolbar, Tooltip, Typography, withStyles, WithStyles } from "@material-ui/core"
import { lightBlue } from "@material-ui/core/colors"
import NewReleases from "@material-ui/icons/NewReleases"
import NewReleasesOutlined from "@material-ui/icons/NewReleasesOutlined"
import * as React from "react"
import { isDevEnvironment } from "../../redux/modules/app"
import { IReviewerUser } from "../../redux/modules/reviewers"
import { ITriageColumn } from "../../redux/modules/triage"
import AssignerAvatarContainer from "../AssignerAvatar/AssignerAvatarContainer"

const styles = (theme: Theme) => ({
    grow: {
        flexGrow: 1,
    },
    newTweetsButton: {
        color: lightBlue[500],
    },
})

export interface IProps {
    column: ITriageColumn
    hasBufferedTweets: boolean
    assignedToUser: IReviewerUser | undefined
    onLoadNewTweetsForColumn: any
    onAssignTriager: Function
    onUnassignTriager: Function
}

export interface IState {}

type TComponentProps = IProps & WithStyles
class TweetColumnBar extends React.PureComponent<TComponentProps, IState> {
    public render() {
        const {
            column,
            hasBufferedTweets,
            assignedToUser,
            onLoadNewTweetsForColumn,
            onAssignTriager,
            onUnassignTriager,
            classes,
        } = this.props

        return (
            <AppBar position="static">
                <Toolbar>
                    <AssignerAvatarContainer assignedToUser={assignedToUser} onAssign={onAssignTriager} onUnassign={onUnassignTriager} />
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {column.search_phrases.join(", ")}
                        {isDevEnvironment() && ` (#${column.id})`}
                    </Typography>
                    {hasBufferedTweets === false && (
                        <IconButton className={classes.newTweetsButton} disabled={true}>
                            <NewReleasesOutlined />
                        </IconButton>
                    )}
                    {hasBufferedTweets === true && (
                        <Tooltip title="There are new tweets in this column - click to show them" aria-label="This column has new tweets">
                            <IconButton className={classes.newTweetsButton} onClick={onLoadNewTweetsForColumn} data-columnid={column.id}>
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
