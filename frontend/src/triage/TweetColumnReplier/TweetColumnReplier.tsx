import { Button, Dialog, DialogContent, Theme, withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import Tweet from "react-tweet"
import { ISocialTweet, ISocialTweetDataUserMention } from "../../redux/modules/social"
import TextFieldWithCharacterCount from "../TextFieldWithCharacterCount/TextFieldWithCharacterCount"

const styles = (theme: Theme) => ({
    button: {
        margin: theme.spacing.unit,
    },
})

export interface IProps {
    open: boolean
    tweet: ISocialTweet
    onCloseReplier: any
    onTweetCharacterLimitError: any
    onTweetCharacterLimitValid: any
}

const getReplyMetadata = (tweet: ISocialTweet) =>
    [
        `@${tweet.data.user.screen_name}`,
        ...tweet.data.entities.user_mentions.map((userMention: ISocialTweetDataUserMention) => `@${userMention.screen_name}`),
    ]
        .filter((screenName: string) => screenName !== "@DemSausage")
        .join(" ") + " "

type TComponentProps = IProps & WithStyles
class TweetColumnReplier extends React.Component<TComponentProps, {}> {
    public render() {
        const { open, tweet, onCloseReplier, onTweetCharacterLimitError, onTweetCharacterLimitValid, classes } = this.props

        return (
            <React.Fragment>
                <Dialog open={open} onClose={onCloseReplier} aria-labelledby="reply-to-tweet-dialog">
                    <DialogContent>
                        <Tweet data={tweet.data} linkProps={{ target: "_blank", rel: "noreferrer" }} />
                        <TextFieldWithCharacterCount
                            id="reply-to-tweet-multiline"
                            label="Replying to tweet"
                            multiline={true}
                            fullWidth={true}
                            autoFocus={true}
                            rows="5"
                            defaultValue={getReplyMetadata(tweet)}
                            margin="normal"
                            variant="filled"
                            characterLimit={280}
                            onLimitError={onTweetCharacterLimitError}
                            onLimitValid={onTweetCharacterLimitValid}
                        />
                        <Button variant="contained" color="primary" className={classes.button}>
                            Reply
                        </Button>
                    </DialogContent>
                </Dialog>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(TweetColumnReplier)
