import {
    Avatar,
    Badge,
    Dialog,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Theme,
    withStyles,
    WithStyles,
} from "@material-ui/core"
import { yellow } from "@material-ui/core/colors"
import blue from "@material-ui/core/colors/blue"
import red from "@material-ui/core/colors/red"
import AssignmentIcon from "@material-ui/icons/Assignment"
import AssignmentReturnIcon from "@material-ui/icons/AssignmentReturn"
import PersonIcon from "@material-ui/icons/Person"
import PowerOff from "@material-ui/icons/PowerOff"
import { sortBy } from "lodash-es"
import * as React from "react"
import { IReviewerAssignment, IReviewerAssignmentCounts, IReviewerUser } from "../../redux/modules/reviewers"

const styles = (theme: Theme) => ({
    assignedAvatar: {
        backgroundColor: blue[100],
        color: blue[600],
    },
    offlineAvatar: {
        backgroundColor: red[100],
        color: red[600],
    },
    assignedAndOfflineAvatar: {
        backgroundColor: red[100],
        color: red[600],
        backgroundImage: "linear-gradient(135deg, #bbdefb 50%, #ffcdd2 50%)",
    },
    badgeMargin: {
        margin: theme.spacing.unit * 2,
    },
})

export interface IProps {
    open: boolean
    assignment: IReviewerAssignment | null
    tweetId: string | null
    reviewers: IReviewerUser[]
    reviewerAssignmentCounts: IReviewerAssignmentCounts
    onCloseAssigner: any
    onAssignTweet: any
    onUnassignTweet: any
}

type TComponentProps = IProps & WithStyles
class TweetColumnAssigner extends React.Component<TComponentProps, {}> {
    private onAssignTweet: any
    private onUnassignTweet: any
    public constructor(props: TComponentProps) {
        super(props)

        this.onAssignTweet = (tweetId: string, userId: number) => () => this.props.onAssignTweet(tweetId, userId)
        this.onUnassignTweet = (assignment: IReviewerAssignment) => () => this.props.onUnassignTweet(assignment)
    }

    public render() {
        const { open, assignment, tweetId, reviewers, reviewerAssignmentCounts, onCloseAssigner, classes } = this.props

        const onlineReviewers = reviewers.filter((reviewer: IReviewerUser) => reviewer.is_accepting_assignments === true)
        const onlineReviewersSorted = sortBy(onlineReviewers, (reviewer: IReviewerUser) => reviewer.name)
        const offlineReviewers = reviewers.filter((reviewer: IReviewerUser) => reviewer.is_accepting_assignments === false)
        const offlineReviewersSorted = sortBy(offlineReviewers, (reviewer: IReviewerUser) => reviewer.name)

        return (
            <React.Fragment>
                <Dialog open={open} onClose={onCloseAssigner} aria-labelledby="assign-tweet-dialog">
                    <DialogTitle id="assign-tweet-dialog-title">Assign a tweet to a reviewer</DialogTitle>
                    <div>
                        <List>
                            {assignment !== null && (
                                <React.Fragment>
                                    <ListItem button={true} onClick={this.onUnassignTweet(assignment)}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <AssignmentReturnIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary="Unassign" />
                                    </ListItem>
                                    <Divider variant="middle" />
                                </React.Fragment>
                            )}
                            {onlineReviewersSorted.map((reviewer: IReviewerUser) => {
                                const isAssigned = assignment !== null && reviewer.id === assignment.user_id

                                const secondaryText = isAssigned ? "Assigned" : undefined
                                const className = isAssigned ? classes.assignedAvatar : undefined

                                return (
                                    <ListItem
                                        key={reviewer.id}
                                        button={true}
                                        onClick={this.onAssignTweet(tweetId, reviewer.id)}
                                        style={isAssigned === true ? { backgroundColor: yellow[200] } : undefined}
                                    >
                                        <ListItemAvatar>
                                            <Avatar className={className}>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={reviewer.name} secondary={secondaryText} />
                                        <ListItemSecondaryAction>
                                            <Badge
                                                color="primary"
                                                badgeContent={reviewerAssignmentCounts[reviewer.id]}
                                                className={classes.badgeMargin}
                                            >
                                                <AssignmentIcon />
                                            </Badge>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )
                            })}
                            {onlineReviewersSorted.length > 0 && offlineReviewersSorted.length > 0 && <Divider variant="middle" />}
                            {offlineReviewersSorted.map((reviewer: IReviewerUser) => {
                                const isAssigned = assignment !== null && reviewer.id === assignment.user_id

                                const secondaryText = isAssigned ? "Assigned - Offline" : "Offline"
                                const className = isAssigned ? classes.assignedAndOfflineAvatar : classes.offlineAvatar

                                return (
                                    <ListItem
                                        key={reviewer.id}
                                        button={true}
                                        onClick={this.onAssignTweet(tweetId, reviewer.id)}
                                        style={{
                                            ...{ opacity: 0.5 },
                                            ...(isAssigned === true ? { backgroundColor: yellow[200] } : undefined),
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar className={className}>
                                                <PowerOff />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={reviewer.name} secondary={secondaryText} />
                                        <ListItemSecondaryAction>
                                            <Badge
                                                color="primary"
                                                badgeContent={reviewerAssignmentCounts[reviewer.id]}
                                                className={classes.badgeMargin}
                                            >
                                                <AssignmentIcon />
                                            </Badge>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )
                            })}
                        </List>
                    </div>
                </Dialog>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(TweetColumnAssigner)
