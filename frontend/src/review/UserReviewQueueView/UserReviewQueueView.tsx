import { AppBar, Button, FormControl, Input, InputLabel, Theme, Tooltip, Typography, withStyles } from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import Toolbar from "@material-ui/core/Toolbar"
import Power from "@material-ui/icons/Power"
import PowerOff from "@material-ui/icons/PowerOff"
import classNames from "classnames"
import * as React from "react"
import { IReviewerAssignment, IReviewerUser } from "../../redux/modules/reviewers"
import ReviewCardContainer from "../ReviewCard/ReviewCardContainer"

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
    reviewerContainer: {
        display: "inline-block",
        padding: 10,
    },
})

export interface IProps {
    assignments: IReviewerAssignment[]
    reviewers: IReviewerUser[]
    currentReviewer: IReviewerUser
    onMarkAsDone: any
    onChangeQueueUser: any
    onToggleUserOnlineStatus: any
    classes: any
}

class UserReviewQueueView extends React.Component<IProps, {}> {
    private onChangeQueueUser: any
    private onToggleUserOnlineStatus: any

    public constructor(props: IProps) {
        super(props)
        this.onChangeQueueUser = (event: any) => {
            props.onChangeQueueUser(event, event.target.value)
        }
        this.onToggleUserOnlineStatus = (event: MouseEvent) => {
            props.onToggleUserOnlineStatus(event, this.props.currentReviewer)
        }
    }

    public render() {
        const { assignments, reviewers, currentReviewer, onMarkAsDone, classes } = this.props

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
                        <ReviewCardContainer key={assignment.id} assignment={assignment} onMarkAsDone={onMarkAsDone} />
                    ))}
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(UserReviewQueueView)
