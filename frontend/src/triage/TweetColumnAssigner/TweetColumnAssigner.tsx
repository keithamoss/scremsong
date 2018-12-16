import { Avatar, Dialog, DialogTitle, Divider, List, ListItem, ListItemAvatar, ListItemText, Theme, withStyles } from "@material-ui/core"
import blue from "@material-ui/core/colors/blue"
import AssignmentReturnIcon from "@material-ui/icons/AssignmentReturn"
import PersonIcon from "@material-ui/icons/Person"
import * as React from "react"
import { IReviewerAssignment, IReviewerUser } from "../../redux/modules/reviewers"

const styles = (theme: Theme) => ({
    selectedAvatar: {
        backgroundColor: blue[100],
        color: blue[600],
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
    onCloseAssigner: any
    onAssignTweet: any
    onUnassignTweet: any
    classes: any
}

export class TweetColumnAssigner extends React.Component<IProps, {}> {
    private onAssignTweet: any
    private onUnassignTweet: any
    public constructor(props: IProps) {
        super(props)
        this.onAssignTweet = (tweetId: string, userId: number) => () => this.props.onAssignTweet(tweetId, userId)
        this.onUnassignTweet = (assignment: IReviewerAssignment) => () => this.props.onUnassignTweet(assignment)
    }

    public render() {
        const { classes, open, assignment, tweetId, reviewers, onCloseAssigner } = this.props

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

                                const secondaryText: string[] = []
                                if (isAssigned) {
                                    secondaryText.push("Assigned")
                                }
                                if (reviewer.is_accepting_assignments === false) {
                                    secondaryText.push("Offline")
                                }

                                return (
                                    <ListItem key={reviewer.id} button={true} onClick={this.onAssignTweet(tweetId, reviewer.id)}>
                                        <ListItemAvatar>
                                            <Avatar className={isAssigned ? classes.selectedAvatar : null}>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={reviewer.name} secondary={secondaryText.join(" - ")} />
                                        {/* <ListItemSecondaryAction>
                                            <Tooltip title="Add" aria-label="Add">
                                                <Badge color="primary" badgeContent={4} className={classes.badgeMargin}>
                                                    <AssignmentIcon />
                                                </Badge>
                                            </Tooltip>
                                        </ListItemSecondaryAction> */}
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
