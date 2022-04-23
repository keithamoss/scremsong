import { Button, Dialog, DialogContent, Theme, withStyles, WithStyles } from '@material-ui/core'
import * as React from 'react'
import Tweet from 'react-tweet'
import { ISocialPrecannedTweetReplies, ISocialTweet, ISocialTweetDataUserMention } from '../../redux/modules/social'
import TextFieldWithCharacterCount from './TextFieldWithCharacterCount'
import TweetReplyChipInput from './TweetReplyChipInput'

const styles = (theme: Theme) => ({
  replyTextField: {
    marginTop: theme.spacing(1),
  },
  precannedRepliesList: {
    marginTop: theme.spacing(1),
  },
  listItemIconToggleState: {
    paddingRight: 15,
  },
  nestedListItem: {
    paddingLeft: theme.spacing(1),
  },
})

export interface IProps {
  open: boolean
  tweet: ISocialTweet
  precanned_replies: ISocialPrecannedTweetReplies
  onCloseReplier: any
  onReply: any
}

export interface IState {
  replyFieldValue: string
  mentions: string[]
  characterPrefixLength: number
  replyButtonDisabled: boolean
  categoryCollapseStates: { [key: string]: boolean }
}

const getUsersToReplyTo = (tweet: ISocialTweet) =>
  [
    ...tweet.data.entities.user_mentions.map((userMention: ISocialTweetDataUserMention) => userMention.screen_name),
    tweet.data.user.screen_name,
  ].filter((screenName: string) => screenName !== 'DemSausage')

const getMentions = (mentions: string[]) => mentions.map((mention: string) => `@${mention}`).join(' ')

const getLengthOfMentions = (mentions: string[]) => getMentions(mentions).length + 1 // + 1 to account for the space between the replies and the text

type TComponentProps = IProps & WithStyles
class TweetColumnReplier extends React.Component<TComponentProps, IState> {
  private onFieldChange: Function

  private onFieldInvalid: Function

  private onFieldValid: Function

  private onChipChange: Function

  // private handleCategoryClick: Function
  // private handleChooseRandomReplyClick: Function
  // private handleReplyChosen: Function
  private onReply: any

  public constructor(props: TComponentProps) {
    super(props)

    const categoryCollapseStates = {}
    // eslint-disable-next-line no-return-assign
    Object.keys(props.precanned_replies).forEach((category: string) => (categoryCollapseStates[category] = false))
    this.state = {
      replyFieldValue: '',
      mentions: getUsersToReplyTo(props.tweet),
      characterPrefixLength: getLengthOfMentions(getUsersToReplyTo(props.tweet)),
      replyButtonDisabled: true,
      categoryCollapseStates,
    }

    this.onFieldChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const replyFieldValue = event.target.value
      this.setState((state: IState) => {
        return { ...state, ...{ replyFieldValue } }
      })
    }
    this.onFieldInvalid = () => {
      this.setState((state: IState) => {
        return { ...state, ...{ replyButtonDisabled: true } }
      })
    }
    this.onFieldValid = () => {
      this.setState((state: IState) => {
        return { ...state, ...{ replyButtonDisabled: false } }
      })
    }
    this.onChipChange = (chips: string[]) => {
      this.setState((state: IState) => {
        return { ...state, mentions: chips, characterPrefixLength: getLengthOfMentions(chips) }
      })
    }
    // this.handleCategoryClick = (category: string) => (e: React.MouseEvent<HTMLElement>) => {
    //     this.setState({
    //         ...this.state,
    //         ...{
    //             categoryCollapseStates: {
    //                 ...this.state.categoryCollapseStates,
    //                 ...{ [category]: !this.state.categoryCollapseStates[category] },
    //             },
    //         },
    //     })
    // }
    // this.handleChooseRandomReplyClick = (category: string) => (e: React.MouseEvent<HTMLElement>) => {
    //     const randomReplyText = this.props.precanned_replies[category][
    //         Math.floor(Math.random() * this.props.precanned_replies[category].length)
    //     ]
    //     this.setState({ ...this.state, replyFieldValue: randomReplyText })
    // }
    // this.handleReplyChosen = (replyText: string) => (e: React.MouseEvent<HTMLElement>) => {
    //     this.setState({ ...this.state, replyFieldValue: replyText })
    // }
    this.onReply = () => {
      const replyText = `${getMentions(this.state.mentions)} ${this.state.replyFieldValue}`
      this.props.onReply(this.props.tweet.data.id_str, replyText)
    }
  }

  public render() {
    const { open, tweet, onCloseReplier, classes } = this.props
    const { replyFieldValue, characterPrefixLength, replyButtonDisabled } = this.state

    return (
      <React.Fragment>
        <Dialog
          open={open}
          scroll="body"
          maxWidth="md"
          onClose={onCloseReplier}
          aria-labelledby="reply-to-tweet-dialog"
        >
          <DialogContent>
            <Tweet data={tweet.data} linkProps={{ target: '_blank', rel: 'noreferrer' }} />
            <TweetReplyChipInput
              defaultValue={getUsersToReplyTo(tweet)}
              mustNotBeEmpty={true}
              onChipChange={this.onChipChange}
              onFieldValid={this.onFieldValid}
              onFieldInvalid={this.onFieldInvalid}
            />
            <TextFieldWithCharacterCount
              value={replyFieldValue}
              label="Tweet your reply"
              required={true}
              multiline={true}
              fullWidth={true}
              autoFocus={true}
              rows="5"
              margin="normal"
              variant="filled"
              className={classes.replyTextField}
              onFieldChange={this.onFieldChange}
              characterPrefixLength={characterPrefixLength}
              characterLimit={280}
              onFieldValid={this.onFieldValid}
              onFieldInvalid={this.onFieldInvalid}
              onKeyDown={(ev) => {
                if (replyButtonDisabled === false && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
                  ev.preventDefault()
                  this.onReply()
                }
              }}
            />
            <Button variant="contained" color="primary" disabled={replyButtonDisabled} onClick={this.onReply}>
              Reply
            </Button>
            {/* <List
                            component="nav"
                            subheader={<ListSubheader component="div">Choose a pre-defined reply</ListSubheader>}
                            className={classes.precannedRepliesList}
                        >
                            {Object.keys(precanned_replies).map((category: string) => {
                                return (
                                    <React.Fragment key={category}>
                                        <ListItem button={true} onClick={this.handleCategoryClick(category)}>
                                            <ListItemIcon>
                                                <ViewList />
                                            </ListItemIcon>
                                            <ListItemText primary={category} />
                                            <ListItemIcon className={classes.listItemIconToggleState}>
                                                <ExpandMore />
                                            </ListItemIcon>
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Choose a random reply">
                                                    <IconButton
                                                        aria-label="View on Twitter"
                                                        color="primary"
                                                        onClick={this.handleChooseRandomReplyClick(category)}
                                                    >
                                                        <Shuffle />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        <Collapse in={categoryCollapseStates[category]} timeout="auto" unmountOnExit={true}>
                                            <List disablePadding={true}>
                                                {precanned_replies[category].map((replyText: string, index: number) => (
                                                    <ListItem
                                                        key={index}
                                                        button={true}
                                                        dense={true}
                                                        className={classes.nestedListItem}
                                                        onClick={this.handleReplyChosen(replyText)}
                                                    >
                                                        <ListItemText inset={true} primary={replyText} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Collapse>
                                    </React.Fragment>
                                )
                            })}
                        </List> */}
          </DialogContent>
        </Dialog>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(TweetColumnReplier)
