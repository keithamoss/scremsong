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
    Tooltip,
    withStyles,
    WithStyles,
} from "@material-ui/core"
import blue from "@material-ui/core/colors/blue"
import red from "@material-ui/core/colors/red"
import AssignmentIcon from "@material-ui/icons/Assignment"
import AssignmentReturnIcon from "@material-ui/icons/AssignmentReturn"
import PersonIcon from "@material-ui/icons/Person"
import PowerOff from "@material-ui/icons/PowerOff"
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

        return (
            <React.Fragment>
                <Dialog open={open} onClose={onCloseAssigner} aria-labelledby="assign-tweet-dialog">
                    <DialogTitle id="assign-tweet-dialog-title">Assign tweet to a reviewer</DialogTitle>
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
                            {reviewers.map((reviewer: IReviewerUser) => {
                                const isAssigned = assignment !== null && reviewer.id === assignment.user_id
                                const isOffline = reviewer.is_accepting_assignments === false

                                const secondaryText: string[] = []
                                if (isAssigned) {
                                    secondaryText.push("Assigned")
                                }
                                if (isOffline === true) {
                                    secondaryText.push("Offline")
                                }

                                let className
                                if (isAssigned === true && isOffline === true) {
                                    className = classes.assignedAndOfflineAvatar
                                } else if (isAssigned === true) {
                                    className = classes.assignedAvatar
                                } else if (isOffline === true) {
                                    className = classes.offlineAvatar
                                }

                                return (
                                    <ListItem key={reviewer.id} button={true} onClick={this.onAssignTweet(tweetId, reviewer.id)}>
                                        <ListItemAvatar>
                                            <Avatar className={className}>{isOffline === false ? <PersonIcon /> : <PowerOff />}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={reviewer.name} secondary={secondaryText.join(" - ")} />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Add" aria-label="Add">
                                                <Badge
                                                    color="primary"
                                                    badgeContent={reviewerAssignmentCounts[reviewer.id]}
                                                    className={classes.badgeMargin}
                                                >
                                                    <AssignmentIcon />
                                                </Badge>
                                            </Tooltip>
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
