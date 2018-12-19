import { Button, Card, CardActions, CardContent, Collapse, IconButton, Theme, withStyles, WithStyles } from "@material-ui/core"
import AssignmentTurnedIn from "@material-ui/icons/AssignmentTurnedIn"
import classNames from "classnames"
import * as React from "react"
import { ExitHandler } from "react-transition-group/Transition"
import Tweet from "react-tweet"
import { LikeIcon, ReplyIcon, RetweetIcon } from "../../aseets/TwitterIcons"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
import { ISocialTweetList } from "../../redux/modules/social"

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

        const replyToTweetLink = (props: any) => (
            <a href={`https://twitter.com/intent/tweet?in_reply_to=${assignment.social_id}`} {...props} target="_blank" />
        )
        const likeTweetLink = (props: any) => (
            <a href={`https://twitter.com/intent/like?tweet_id=${assignment.social_id}`} {...props} target="_blank" />
        )
        const retweetTweetLink = (props: any) => (
            <a href={`https://twitter.com/intent/retweet?tweet_id=${assignment.social_id}`} {...props} target="_blank" />
        )

        return (
            <Collapse in={this.state.shown} onExited={this.onMarkAsDone}>
                <Card className={classes.paddedCard}>
                    <CardContent>
                        <Tweet data={tweets[assignment.social_id].data} />
                    </CardContent>
                    <CardActions disableActionSpacing={true}>
                        <IconButton disableRipple={true} component={replyToTweetLink}>
                            <ReplyIcon />
                        </IconButton>

                        <IconButton disableRipple={true} component={likeTweetLink}>
                            <LikeIcon />
                        </IconButton>

                        <IconButton disableRipple={true} component={retweetTweetLink}>
                            <RetweetIcon />
                        </IconButton>

                        <Button color={"primary"} variant="contained" className={classes.button} onClick={this.handleChange}>
                            <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                            Mark as done
                        </Button>
                    </CardActions>
                </Card>
            </Collapse>
        )
    }
}

export default withStyles(styles)(ReviewCard)
