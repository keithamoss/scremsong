/* eslint-disable react/no-access-state-in-setstate */
import {
  Badge,
  Button,
  Card,
  CardContent,
  Collapse,
  Menu,
  MenuItem,
  Theme,
  Tooltip,
  withStyles,
  WithStyles,
} from '@material-ui/core'
import AssignmentInd from '@material-ui/icons/AssignmentInd'
import AssignmentTurnedIn from '@material-ui/icons/AssignmentTurnedIn'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import OpenInNew from '@material-ui/icons/OpenInNew'
import classNames from 'classnames'
import * as React from 'react'
import { ENotificationVariant } from '../../redux/modules/app'
import { ESocialAssignmentCloseReason, IReviewerAssignment } from '../../redux/modules/interfaces.reviewers'
import { getNewestTweetId, getOldestUnreadTweetId, getTweetStyle, ISocialTweetList } from '../../redux/modules/social'
import TweetColumnAssignerContainer, {
  ETweetColumnAssignerMode,
} from '../../triage/TweetColumnAssigner/TweetColumnAssignerContainer'
import TweetCardContainer from '../../twitter/TweetCard/TweetCardContainer'
import TweetThread from '../TweetThread/TweetThread'

const styles = (theme: Theme) =>
  ({
    card: {
      marginBottom: theme.spacing(1),
      minHeight: 145,
    },
    cardContent: {
      paddingBottom: theme.spacing(1),
      display: 'flex',
      flexDirection: 'row',
    },
    tweetColumn: {
      flexGrow: 1,
      minWidth: 600,
    },
    actionsColumn: {
      display: 'flex',
      flexDirection: 'column',
      marginLeft: 10,
    },
    newTweetsBadge: {
      marginRight: 23,
    },
    button: {
      justifyContent: 'start',
    },
    leftIcon: {
      marginRight: theme.spacing(1),
    },
    iconSmall: {
      fontSize: 20,
    },
  } as any)

export interface IProps {
  assignment: IReviewerAssignment
  tweets: ISocialTweetList
  unreadTweetIds: string[]
  onCloseAssignment: Function
  sendNotificationWithUndo: Function
  onRestoreAssignment: Function
  onThreadClosed: Function
}

export interface IState {
  shown: boolean
  assignerOpen: boolean
  assignmentId: number | null
  tweetShown: boolean
  threadShown: boolean
  anchorEl: HTMLElement | null
}

type TComponentProps = IProps & WithStyles
class ReviewCard extends React.PureComponent<TComponentProps, IState> {
  private onOpenAssigner: any

  private onCloseAssigner: any

  private onBeforeReassign: any

  private handleShowThread: any

  private handleExpandThread: any

  private handleCollapseThread: any

  private handleExpandTweet: any

  private handleOpenCloseReasonMenu: any

  private handleChooseCloseReason: any

  private handleCloseCloseReasonMenu: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = {
      shown: true,
      assignerOpen: false,
      assignmentId: null,
      tweetShown: true,
      threadShown: false,
      anchorEl: null,
    }

    this.onOpenAssigner = (assignmentId: number) => () => {
      this.setState({ ...this.state, ...{ assignerOpen: true, assignmentId } })
    }
    this.onCloseAssigner = () => {
      this.setState({ ...this.state, ...{ assignerOpen: false, assignmentId: null } })
    }
    this.onBeforeReassign = (callback: () => void) => {
      this.handleCardCollapseOrExpand(false, callback)
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

    this.handleOpenCloseReasonMenu = (event: React.MouseEvent<HTMLElement>) => {
      this.setState({ ...this.state, anchorEl: event.currentTarget })
    }
    this.handleChooseCloseReason =
      (reason: ESocialAssignmentCloseReason) => (_event: React.MouseEvent<HTMLElement>) => {
        this.handleCloseCloseReasonMenu()

        this.handleCardCollapseOrExpand(false, () => {
          this.props.onCloseAssignment(reason)
          this.sendUndoableNotification()
        })
      }
    this.handleCloseCloseReasonMenu = () => {
      this.setState({ ...this.state, anchorEl: null })
    }
  }

  public sendUndoableNotification = () => {
    this.props.sendNotificationWithUndo({
      message: 'Assignment closed',
      options: {
        variant: ENotificationVariant.DEFAULT,
        autoHideDuration: 6000,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        action: (
          <Button size="small" color="inherit">
            Undo
          </Button>
        ),
        onClose: (_event: React.MouseEvent<HTMLElement>, reason: string) => {
          if (reason !== 'timeout') {
            this.props.onRestoreAssignment(this.props.assignment)
          }
        },
      },
    })
  }

  public handleCardCollapseOrExpand = (shown: boolean, callback: () => void) => {
    if (typeof callback === 'function') {
      this.setState({ ...this.state, shown }, callback)
    } else {
      this.setState({ ...this.state, shown })
    }
  }

  public render() {
    const { assignment, tweets, unreadTweetIds, classes } = this.props
    const { assignerOpen, assignmentId, tweetShown, threadShown, anchorEl } = this.state

    const tweetIdToDisplay =
      unreadTweetIds.length > 0
        ? getOldestUnreadTweetId(unreadTweetIds)!
        : getNewestTweetId([assignment.social_id, ...assignment.thread_tweets])!

    const TwitterLink = (props: any) => (
      <a
        href={`https://twitter.com/DemSausage/status/${tweetIdToDisplay}`}
        {...props}
        target="_blank"
        rel="noreferrer"
      />
    )

    return (
      <React.Fragment>
        <TweetColumnAssignerContainer
          open={assignerOpen}
          assignmentId={assignmentId}
          tweetId={null}
          mode={ETweetColumnAssignerMode.REASSIGN}
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
                  justifyContent: threadShown === false ? 'end' : 'end',
                }}
              >
                <Tooltip title="Mark this assignment as closed and remove it from your queue" enterDelay={1500}>
                  <Button
                    color="primary"
                    variant="text"
                    className={classes.button}
                    onClick={this.handleOpenCloseReasonMenu}
                  >
                    <AssignmentTurnedIn className={classNames(classes.leftIcon, classes.iconSmall)} />
                    Close
                  </Button>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={this.handleCloseCloseReasonMenu}>
                  {Object.keys(ESocialAssignmentCloseReason).map((key: string) => {
                    if (key !== 'NOT_ACTIONED') {
                      return (
                        <MenuItem key={key} onClick={this.handleChooseCloseReason(ESocialAssignmentCloseReason[key])}>
                          {ESocialAssignmentCloseReason[key]}
                        </MenuItem>
                      )
                    }
                    return null
                  })}
                </Menu>
                <Button
                  color="primary"
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
                        color="primary"
                        variant="text"
                        className={classes.button}
                        onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                      >
                        {threadShown === true ? (
                          <ExpandLess className={classNames(classes.leftIcon, classes.iconSmall)} />
                        ) : (
                          <ExpandMore className={classNames(classes.leftIcon, classes.iconSmall)} />
                        )}
                        {threadShown === true ? 'Close thread' : 'Show thread'}
                      </Button>
                    </Badge>
                  </Tooltip>
                )}
                {assignment.thread_tweets.length > 0 && unreadTweetIds.length === 0 && (
                  <Button
                    color="primary"
                    variant="text"
                    className={classes.button}
                    onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                  >
                    {threadShown === true ? (
                      <ExpandLess className={classNames(classes.leftIcon, classes.iconSmall)} />
                    ) : (
                      <ExpandMore className={classNames(classes.leftIcon, classes.iconSmall)} />
                    )}
                    {threadShown === true ? 'Close thread' : 'Show thread'}
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
