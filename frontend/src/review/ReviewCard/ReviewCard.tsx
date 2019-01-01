import { Button, Card, CardActions, CardContent, Collapse, IconButton, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import AssignmentReturn from "@material-ui/icons/AssignmentReturn"
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn"
import OpenInNew from "@material-ui/icons/OpenInNew"
import classNames from "classnames"
import * as React from "react"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import { ISocialTweetList } from "../../redux/modules/social"
import TweetColumnAssignerContainer, { eTweetColumnAssignerMode } from "../../triage/TweetColumnAssigner/TweetColumnAssignerContainer"
import TweetThread from "../TweetThread/TweetThread"

const styles = (theme: Theme) => ({
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
})

export interface IProps {
    assignment: IReviewerAssignment
    tweets: ISocialTweetList
    onMarkAsDone: any
}

export interface IState {
    shown: boolean
    assignerOpen: boolean
    assignmentId: number | null
}

type TComponentProps = IProps & WithStyles
class ReviewCard extends React.PureComponent<TComponentProps, IState> {
    private onOpenAssigner: any
    private onCloseAssigner: any
    private onBeforeReassign: any
    private onMarkAsDone: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { shown: true, assignerOpen: false, assignmentId: null }

        this.onOpenAssigner = (assignmentId: number) => () => {
            this.setState({ ...this.state, ...{ assignerOpen: true, assignmentId } })
        }

        this.onCloseAssigner = () => {
            this.setState({ ...this.state, ...{ assignerOpen: false, assignmentId: null } })
        }

        this.onBeforeReassign = (callback: any) => {
            this.handleCardCollapse(callback)
        }

        this.onMarkAsDone = (node: HTMLElement) => {
            this.handleCardCollapse(() => this.props.onMarkAsDone(this.props.assignment))
        }
    }

    public handleCardCollapse = (callback: any = undefined) => {
        if (typeof callback === "function") {
            this.setState({ ...this.state, ...{ shown: false } }, callback)
        } else {
            this.setState({ ...this.state, ...{ shown: false } })
        }
    }

    public render() {
        const { assignment, tweets, classes } = this.props
        const { assignerOpen, assignmentId } = this.state

        const TwitterLink = (props: any) => (
            <a href={`https://twitter.com/DemSausage/status/${props["data-tweetid"]}`} {...props} target="_blank" />
        )

        // const replyToTweetLink = (props: any) => (
        //     <a href={`https://twitter.com/intent/tweet?in_reply_to=${actualTweetId}`} {...props} target="_blank" />
        // )
        // const likeTweetLink = (props: any) => (
        //     <a href={`https://twitter.com/intent/like?tweet_id=${actualTweetId}`} {...props} target="_blank" />
        // )
        // const retweetTweetLink = (props: any) => (
        //     <a href={`https://twitter.com/intent/retweet?tweet_id=${actualTweetId}`} {...props} target="_blank" />
        // )

        return (
            <React.Fragment>
                <TweetColumnAssignerContainer
                    open={assignerOpen}
                    assignmentId={assignmentId}
                    tweetId={null}
                    mode={eTweetColumnAssignerMode.REASSIGN}
                    onCloseAssigner={this.onCloseAssigner}
                    onBeforeReassign={this.onBeforeReassign}
                />
                <Collapse in={this.state.shown}>
                    <Card className={classes.paddedCard}>
                        <CardContent>
                            <TweetThread
                                tweetId={assignment.social_id}
                                threadRelationships={assignment.thread_relationships}
                                tweets={tweets}
                            />
                        </CardContent>
                        <CardActions disableActionSpacing={true}>
                            {/* <IconButton disableRipple={true} component={replyToTweetLink}>
                                <ReplyIcon />
                            </IconButton>

                            <IconButton disableRipple={true} component={likeTweetLink}>
                                <LikeIcon />
                            </IconButton>

                            <IconButton disableRipple={true} component={retweetTweetLink}>
                                <RetweetIcon />
                            </IconButton> */}

                            <Button color={"primary"} variant="contained" className={classes.button} onClick={this.onMarkAsDone}>
                                <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                Mark as done
                            </Button>
                            <Button
                                color={"primary"}
                                variant="contained"
                                className={classes.button}
                                onClick={this.onOpenAssigner(assignment.id)}
                            >
                                <AssignmentReturn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                Reassign
                            </Button>
                            <Tooltip title="View this tweet on twitter.com">
                                <IconButton
                                    aria-label="View on Twitter"
                                    color="secondary"
                                    component={TwitterLink}
                                    data-tweetid={assignment.social_id}
                                >
                                    <OpenInNew className={classes.iconSmall} />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                </Collapse>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(ReviewCard)
