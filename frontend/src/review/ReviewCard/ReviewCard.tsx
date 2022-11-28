/* eslint-disable react/no-access-state-in-setstate */
import AssignmentInd from '@mui/icons-material/AssignmentInd'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import MoreVert from '@mui/icons-material/MoreVert'
import OpenInNew from '@mui/icons-material/OpenInNew'
import { Badge, Button, Card, CardContent, Collapse, Menu, MenuItem, Tooltip } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { ENotificationVariant } from '../../redux/modules/app'
import { ESocialAssignmentCloseReason, IReviewerAssignment } from '../../redux/modules/interfaces.reviewers'
import { getNewestTweetId, getOldestUnreadTweetId, getTweetStyle, ISocialTweetList } from '../../redux/modules/social'
import TweetColumnAssignerContainer, {
  ETweetColumnAssignerMode,
} from '../../triage/TweetColumnAssigner/TweetColumnAssignerContainer'
import TweetCardContainer from '../../twitter/TweetCard/TweetCardContainer'
import TweetThread from '../TweetThread/TweetThread'

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  minHeight: 145,
}))

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  display: 'flex',
  flexDirection: 'row',
}))

const StyledTweetColumnDiv = styled('div')(() => ({
  flexGrow: 1,
  minWidth: 600,
}))

const StyledActionsColumnDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 10,
}))

const StyledButton = styled(Button)(() => ({
  justifyContent: 'flex-start',
}))

const StyledNewTweetsBadge = styled(Badge)(() => ({
  marginRight: 23,
}))

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

type TComponentProps = IProps
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
          <Button size="small" color="inherit" onClick={() => this.props.onRestoreAssignment(this.props.assignment)}>
            Undo
          </Button>
        ),
        // onClose: (_event: React.MouseEvent<HTMLElement>, reason: string) => {
        //   if (reason !== 'timeout') {
        //     this.props.onRestoreAssignment(this.props.assignment)
        //   }
        // },
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
    const { assignment, tweets, unreadTweetIds } = this.props
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
          <StyledCard>
            <StyledCardContent>
              <StyledTweetColumnDiv>
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
              </StyledTweetColumnDiv>
              <StyledActionsColumnDiv
                sx={{
                  justifyContent: threadShown === false ? 'end' : 'end',
                }}
              >
                <Tooltip title="Mark this assignment as closed and remove it from your queue" enterDelay={1500}>
                  <StyledButton
                    color="primary"
                    variant="text"
                    startIcon={<MoreVert />}
                    onClick={this.handleOpenCloseReasonMenu}
                  >
                    Options
                  </StyledButton>
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
                <StyledButton
                  color="primary"
                  variant="text"
                  fullWidth
                  startIcon={<AssignmentInd />}
                  onClick={this.onOpenAssigner(assignment.id)}
                >
                  Reassign
                </StyledButton>
                {assignment.thread_tweets.length > 0 && unreadTweetIds.length > 1 && (
                  <Tooltip title={`This thread has ${unreadTweetIds.length - 1} more unread tweets`} enterDelay={1500}>
                    <StyledNewTweetsBadge badgeContent={unreadTweetIds.length - 1} color="secondary">
                      <StyledButton
                        color="primary"
                        variant="text"
                        startIcon={threadShown === true ? <ExpandLess /> : <ExpandMore />}
                        onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                      >
                        {threadShown === true ? 'Close thread' : 'Show thread'}
                      </StyledButton>
                    </StyledNewTweetsBadge>
                  </Tooltip>
                )}
                {assignment.thread_tweets.length > 0 && unreadTweetIds.length === 0 && (
                  <StyledButton
                    color="primary"
                    variant="text"
                    startIcon={threadShown === true ? <ExpandLess /> : <ExpandMore />}
                    onClick={threadShown === false ? this.handleShowThread : this.handleCollapseThread}
                  >
                    {threadShown === true ? 'Close thread' : 'Show thread'}
                  </StyledButton>
                )}
                <Button
                  color="primary"
                  variant="text"
                  startIcon={<OpenInNew />}
                  component={TwitterLink}
                  data-tweetid={assignment.social_id}
                >
                  View on Twitter
                </Button>
              </StyledActionsColumnDiv>
            </StyledCardContent>
          </StyledCard>
        </Collapse>
      </React.Fragment>
    )
  }
}

export default ReviewCard
