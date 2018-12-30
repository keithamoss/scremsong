import { Dialog, Theme, withStyles, WithStyles } from "@material-ui/core"
import blue from "@material-ui/core/colors/blue"
import red from "@material-ui/core/colors/red"
import * as React from "react"
import { ISocialTweet } from "../../redux/modules/social"

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
    tweet: ISocialTweet
    onCloseReplier: any
}

type TComponentProps = IProps & WithStyles
class TweetColumnReplier extends React.Component<TComponentProps, {}> {
    public constructor(props: TComponentProps) {
        super(props)
    }

    public render() {
        const { open, onCloseReplier } = this.props

        return (
            <React.Fragment>
                <Dialog open={open} onClose={onCloseReplier} aria-labelledby="reply-to-tweet-dialog">
                    Foobar.
                </Dialog>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(TweetColumnReplier)
