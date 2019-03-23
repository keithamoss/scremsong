import { Badge, Button, Card, CardContent, Collapse, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core"
import AssignmentInd from "@material-ui/icons/AssignmentInd"
import AssignmentReturn from "@material-ui/icons/AssignmentReturn"
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn"
import Close from "@material-ui/icons/Close"
import ExpandLess from "@material-ui/icons/ExpandLess"
import ExpandMore from "@material-ui/icons/ExpandMore"
import OpenInNew from "@material-ui/icons/OpenInNew"
import classNames from "classnames"
import * as React from "react"
import { eNotificationVariant } from "../../redux/modules/app"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import { getNewestTweetId, getOldestUnreadTweetId, getTweetStyle, ISocialTweetList } from "../../redux/modules/social"
import TweetColumnAssignerContainer, { eTweetColumnAssignerMode } from "../../triage/TweetColumnAssigner/TweetColumnAssignerContainer"
import TweetCardContainer from "../../twitter/TweetCard/TweetCardContainer"
import TweetThread from "../TweetThread/TweetThread"

const styles = (theme: Theme) =>
    ({
        card: {
            marginBottom: theme.spacing.unit,
            minHeight: 145,
        },
        cardContent: {
            paddingBottom: theme.spacing.unit * 2,
            display: "flex",
            flexDirection: "row",
        },
        tweetColumn: {
            flexGrow: 1,
            minWidth: 750,
        },
        actionsColumn: {
            display: "flex",
            flexDirection: "column",
            marginLeft: 10,
        },
        newTweetsBadge: {
            marginRight: 23,
        },
        button: {
            justifyContent: "start",
        },
        leftIcon: {
            marginRight: theme.spacing.unit,
        },
        iconSmall: {
            fontSize: 20,
        },
    } as any)

export interface IProps {
    assignment: IReviewerAssignment
    tweets: ISocialTweetList
    unreadTweetIds: string[]
    sendNotificationWithUndo: Function
    onAwaitReply: any
    onMarkAsDone: Function
    onMarkAsClosed: any
    onThreadClosed: Function
}

export interface IState {
    shown: boolean
    assignerOpen: boolean
    assignmentId: number | null
    tweetShown: boolean
    threadShown: boolean
}

type TComponentProps = IProps & WithStyles
class ReviewCard extends React.PureComponent<TComponentProps, IState> {
    private onOpenAssigner: any
    private onCloseAssigner: any
    private onBeforeReassign: any
    private onMarkAsDone: any
    private onMarkAsClosed: any
    private handleShowThread: any
    private handleExpandThread: any
    private handleCollapseThread: any
    private handleExpandTweet: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { shown: true, assignerOpen: false, assignmentId: null, tweetShown: true, threadShown: false }

        this.onOpenAssigner = (assignmentId: number) => () => {
            this.setState({ ...this.state, ...{ assignerOpen: true, assignmentId } })
        }
        this.onCloseAssigner = () => {
            this.setState({ ...this.state, ...{ assignerOpen: false, assignmentId: null } })
        }

        this.onBeforeReassign = (callback: any) => {
            this.handleCardCollapseOrExpand(false, callback)
        }

        this.onMarkAsDone = (node: HTMLElement) => {
            this.handleCardCollapseOrExpand(false, () => {
                this.sendMarkAsDoneNotification()
            })
        }

        this.onMarkAsClosed = (node: HTMLElement) => {
            this.handleCardCollapseOrExpand(false, () => {
                this.sendMarkAsClosedNotification()
            })
        }

        this.handleShowThread = () => {
            this.setState({ ...this.state, ...{ tweetShown: !this.state.tweetShown } })
        }
        this.handleExpandThread = () => {
            this.setState({ ...this.state, ...{ threadShown: !this.state.threadShown } })
        }
        this.handleCollapseThread = () => {
            this.setState({ ...this.state, ...{ threadShown: !this.state.threadShown } })
            this.props.onThreadClosed()
        }
        this.handleExpandTweet = () => {
            this.setState({ ...this.state, ...{ tweetShown: !this.state.tweetShown } })
        }
    }

    public sendMarkAsDoneNotification = () => {
        this.props.sendNotificationWithUndo({
            message: "Assignment marked as done",
            options: {
                variant: eNotificationVariant.DEFAULT,
                autoHideDuration: 6000,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                },
                action: (
                    <Button size="small" color="inherit">
                        Undo
                    </Button>
                ),
                onClose: (event: React.MouseEvent<any>, reason: string) => {
                    if (reason === "timeout") {
                        this.props.onMarkAsDone(this.props.assignment)
                    } else {
                        this.handleCardCollapseOrExpand(true)
                    }
                },
            },
        })
    }

    public sendMarkAsClosedNotification = () => {
        this.props.sendNotificationWithUndo({
            message: "Assignment marked as closed",
            options: {
                variant: eNotificationVariant.DEFAULT,
                autoHideDuration: 6000,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                },
                action: (
                    <Button size="small" color="inherit">
                        Undo
                    </Button>
                ),
                onClose: (event: React.MouseEvent<any>, reason: string) => {
                    if (reason === "timeout") {
                        this.props.onMarkAsClosed(this.props.assignment)
                    } else {
                        this.handleCardCollapseOrExpand(true)
                    }
                },
            },
        })
    }

    public handleCardCollapseOrExpand = (shown: boolean, callback: any = undefined) => {
        if (typeof callback === "function") {
            this.setState({ ...this.state, shown }, callback)
        } else {
            this.setState({ ...this.state, shown })
        }
    }

    public render() {
        const { assignment, tweets, unreadTweetIds, onAwaitReply, classes } = this.props
        const { assignerOpen, assignmentId, tweetShown, threadShown } = this.state

        const tweetIdToDisplay =
            unreadTweetIds.length > 0
                ? getOldestUnreadTweetId(unreadTweetIds)!
                : getNewestTweetId([assignment.social_id, ...assignment.thread_tweets])!

        const TwitterLink = (props: any) => (
            <a href={`https://twitter.com/DemSausage/status/${tweetIdToDisplay}`} {...props} target="_blank" />
        )

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
                    <Card className={classes.card}>
                        <CardContent className={classes.cardContent}>
                            <div className={classes.tweetColumn}>
                                <Collapse in={tweetShown} timeout={500} onExited={this.handleExpandThread}>
                                    <TweetCardContainer
                                        tweetId={tweetIdToDisplay}
                                        tweetStyles={getTweetStyle(assignment, tweets[tweetIdToDisplay])}
                                    />
                                </Collapse>
                                <Collapse in={threadShown} timeout={500} unmountOnExit={true} onExited={this.handleExpandTweet}>
                                    <TweetThread
                                        tweetId={assignment.social_id}
                                        threadRelationships={assignment.thread_relationships}
                                        tweets={tweets}
                                        assignment={assignment}
                                    />
                                </Collapse>
                            </div>
                            <div
                                className={classes.actionsColumn}
                                style={{
                                    justifyContent: threadShown === false ? "end" : "end",
                                }}
                            >
                                <Tooltip
                                    title="Mark this assignment as awaiting a reply (this moves it to the bottom of your assignments list)"
                                    enterDelay={1500}
                                >
                                    <Button color={"primary"} variant="text" className={classes.button} onClick={onAwaitReply}>
                                        <AssignmentReturn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        Await reply
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    title="Mark this assignment as done and remove it from your queue (e.g. the person responded and we've updated the polling place)"
                                    enterDelay={1500}
                                >
                                    <Button color={"primary"} variant="text" className={classes.button} onClick={this.onMarkAsDone}>
                                        <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        Done
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    title="Mark this assignment as closed and remove it from your queue (e.g. the person never responded)"
                                    enterDelay={1500}
                                >
                                    <Button color={"primary"} variant="text" className={classes.button} onClick={this.onMarkAsClosed}>
                                        <Close className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        Close
                                    </Button>
                                </Tooltip>
                            </div>
                            <div
                                className={classes.actionsColumn}
                                style={{
                                    justifyContent: threadShown === false ? "end" : "end",
                                }}
                            >
                                <Button
                                    color={"primary"}
                                    variant="text"
                                    className={classes.button}
                                    onClick={this.onOpenAssigner(assignment.id)}
                                >
                                    <AssignmentInd className={classNames(classes.leftIcon, classes.iconSmall)} />
                                    Reassign
                                </Button>
                                {assignment.thread_tweets.length > 0 && unreadTweetIds.length > 1 && (
                                    <Tooltip title={`This thread has ${unreadTweetIds.length - 1} more unread tweets`} enterDelay={1500}>
                                        <Badge
                                            badgeContent={unreadTweetIds.length - 1}
                                            color="secondary"
                                            className={classes.newTweetsBadge}
                                        >
                                            <Button
                                                color={"primary"}
                                                variant="text"
                                                className={classes.button}
                                                onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                                            >
                                                {threadShown === true ? (
                                                    <ExpandLess className={classNames(classes.leftIcon, classes.iconSmall)} />
                                                ) : (
                                                    <ExpandMore className={classNames(classes.leftIcon, classes.iconSmall)} />
                                                )}
                                                {threadShown === true ? "Close thread" : "Show thread"}
                                            </Button>
                                        </Badge>
                                    </Tooltip>
                                )}
                                {assignment.thread_tweets.length > 0 && unreadTweetIds.length === 0 && (
                                    <Button
                                        color={"primary"}
                                        variant="text"
                                        className={classes.button}
                                        onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                                    >
                                        {threadShown === true ? (
                                            <ExpandLess className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        ) : (
                                            <ExpandMore className={classNames(classes.leftIcon, classes.iconSmall)} />
                                        )}
                                        {threadShown === true ? "Close thread" : "Show thread"}
                                    </Button>
                                )}
                                <Button
                                    color="primary"
                                    variant="text"
                                    className={classes.button}
                                    component={TwitterLink}
                                    data-tweetid={assignment.social_id}
                                >
                                    <OpenInNew className={classNames(classes.leftIcon, classes.iconSmall)} />
                                    View on Twitter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </Collapse>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(ReviewCard)
