import { Button, Card, CardActions, CardContent, Collapse, Theme, withStyles, WithStyles } from "@material-ui/core"
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn"
import OpenInNew from "@material-ui/icons/OpenInNew"
import classNames from "classnames"
import * as React from "react"
import { ExitHandler } from "react-transition-group/Transition"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import { ISocialTweetList } from "../../redux/modules/social"
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
}

type TComponentProps = IProps & WithStyles
class ReviewCard extends React.PureComponent<TComponentProps, IState> {
    private onMarkAsDone: ExitHandler

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { shown: true }

        this.onMarkAsDone = (node: HTMLElement) => {
            this.props.onMarkAsDone(this.props.assignment)
        }
    }

    public handleChange: any = () => {
        this.setState({ shown: false })
    }

    public render() {
        const { assignment, tweets, classes } = this.props

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
                <Collapse in={this.state.shown} onExited={this.onMarkAsDone}>
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

                            <Button color={"primary"} variant="contained" className={classes.button} onClick={this.handleChange}>
                                <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                                Mark as done
                            </Button>
                            <Button
                                color={"secondary"}
                                variant="contained"
                                className={classes.button}
                                component={TwitterLink}
                                data-tweetid={assignment.social_id}
                            >
                                <OpenInNew className={classNames(classes.leftIcon, classes.iconSmall)} />
                                Open on Twitter
                            </Button>
                        </CardActions>
                    </Card>
                </Collapse>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(ReviewCard)
