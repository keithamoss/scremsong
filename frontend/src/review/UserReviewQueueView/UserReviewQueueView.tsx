import {
    AppBar,
    Button,
    Card,
    CardActions,
    CardContent,
    FormControl,
    Input,
    InputLabel,
    Theme,
    Tooltip,
    Typography,
    withStyles,
} from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import Toolbar from "@material-ui/core/Toolbar"
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn"
import Power from "@material-ui/icons/Power"
import PowerOff from "@material-ui/icons/PowerOff"
import classNames from "classnames"
import * as React from "react"
import Tweet from "react-tweet"
import { IReviewerAssignment, IReviewerUser } from "../../redux/modules/reviewers"
import { ISocialTweetList } from "../../redux/modules/social"

const styles = (theme: Theme) => ({
    white: {
        color: theme.palette.common.white,
    },
    formControl: {
        minWidth: 165,
    },
    focusedInputLabel: {
        color: "white !important",
    },
    underline: {
        "&:before": {
            borderBottomColor: "rgba(255, 255, 255, 0.4)",
        },
        "&:hover:not($disabled)::before": {
            borderBottomColor: "rgba(255, 255, 255, 0.87) !important",
        },
        "&:after": {
            borderBottomColor: "rgba(255, 255, 255, 0.4)",
        },
    },
    disabled: {},
    grow: {
        flexGrow: 1,
    },
    button: {
        margin: theme.spacing.unit,
    },
    leftIcon: {
        marginRight: theme.spacing.unit,
    },
    iconSmall: {
        fontSize: 20,
    },
    paddedCard: {
        marginBottom: "15px",
    },
    reviewerContainer: {
        display: "inline-block",
        padding: 10,
    },
})

export interface IProps {
    assignments: IReviewerAssignment[]
    tweets: ISocialTweetList
    reviewers: IReviewerUser[]
    currentReviewer: IReviewerUser
    onMarkAsDone: any
    onChangeQueueUser: any
    onToggleUserOnlineStatus: any
    classes: any
}

export class UserReviewQueueView extends React.Component<IProps, {}> {
    private onChangeQueueUser: any
    private onToggleUserOnlineStatus: any
    private onMarkAsDone: Function

    public constructor(props: IProps) {
        super(props)
        this.onChangeQueueUser = (event: any) => {
            props.onChangeQueueUser(event, event.target.value)
        }
        this.onToggleUserOnlineStatus = (event: MouseEvent) => {
            props.onToggleUserOnlineStatus(event, this.props.currentReviewer)
        }
        this.onMarkAsDone = (assignment: IReviewerAssignment) => () => this.props.onMarkAsDone(assignment)
    }
    public render() {
        const { assignments, tweets, reviewers, currentReviewer, classes } = this.props

        return (
            <React.Fragment>
                <AppBar position="static">
                    <Toolbar>
                        <FormControl classes={{ root: classes.formControl }}>
                            <InputLabel htmlFor="queue-user-control" classes={{ root: classes.white, focused: classes.focusedInputLabel }}>
                                Viewing the queue for
                            </InputLabel>
                            <Select
                                value={currentReviewer.id}
                                onChange={this.onChangeQueueUser}
                                inputProps={{
                                    name: "queue-user",
                                    id: "queue-user-control",
                                }}
                                classes={{ root: classes.white, icon: classes.white }}
                                input={
                                    <Input
                                        classes={{
                                            underline: classes.underline,
                                        }}
                                    />
                                }
                            >
                                {reviewers.map((reviewer: IReviewerUser) => (
                                    <MenuItem key={reviewer.id} value={reviewer.id}>
                                        {reviewer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="h6" color="inherit" className={classes.grow} />
                        <Tooltip title="Let us know if you're available to receive tweets">
                            <Button variant="contained" color="primary" className={classes.button} onClick={this.onToggleUserOnlineStatus}>
                                {currentReviewer.is_accepting_assignments ? (
                                    <Power className={classNames(classes.leftIcon, classes.iconSmall)} />
                                ) : (
                                    <PowerOff className={classNames(classes.leftIcon, classes.iconSmall)} />
                                )}
                                {currentReviewer.is_accepting_assignments ? "Online" : "Offline"}
                            </Button>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                <div className={classes.reviewerContainer}>
                    {assignments.map((assignment: IReviewerAssignment) => (
                        <React.Fragment key={assignment.id}>
                            <Card className={classes.paddedCard}>
                                <CardContent>
                                    <Tweet data={tweets[assignment.social_id].data} />
                                </CardContent>
                                <CardActions>
                                    <Button
                                        color={"primary"}
                                        variant="contained"
                                        className={classes.button}
                                        onClick={this.onMarkAsDone(assignment)}
                                    >
                                        <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        Mark as done
                                    </Button>
                                </CardActions>
                            </Card>
                        </React.Fragment>
                    ))}
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(UserReviewQueueView)
