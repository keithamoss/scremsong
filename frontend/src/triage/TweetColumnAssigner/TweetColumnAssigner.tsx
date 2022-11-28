import AssignmentIcon from '@mui/icons-material/Assignment'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import PersonIcon from '@mui/icons-material/Person'
import PowerOff from '@mui/icons-material/PowerOff'
import {
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@mui/material'
import { yellow } from '@mui/material/colors'
import blue from '@mui/material/colors/blue'
import red from '@mui/material/colors/red'
import { styled } from '@mui/material/styles'
import { sortBy } from 'lodash-es'
import * as React from 'react'
import { IReviewerAssignment, IReviewerAssignmentCounts, IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { ETweetColumnAssignerMode } from './TweetColumnAssignerContainer'

const StyledAssignedAvatar = styled(Avatar)(() => ({
  backgroundColor: blue[100],
  color: blue[600],
}))

const StyledOfflineAvatar = styled(Avatar)(() => ({
  backgroundColor: red[100],
  color: red[600],
}))

const StyledAssignedAndOfflineAvatar = styled(Avatar)(() => ({
  backgroundColor: red[100],
  color: red[600],
  backgroundImage: 'linear-gradient(135deg, #bbdefb 50%, #ffcdd2 50%)',
}))

const StyledBadge = styled(Badge)(({ theme }) => ({
  margin: theme.spacing(2),
}))

export interface IProps {
  open: boolean
  assignment: IReviewerAssignment | null
  tweetId: string | null
  currentReviewer: IReviewerUser
  reviewers: IReviewerUser[]
  reviewerAssignmentCounts: IReviewerAssignmentCounts
  mode: ETweetColumnAssignerMode
  onCloseAssigner: any
  onAssignTweet: any
  onUnassignTweet: any
  onReassign: any
  onBulkReassign: any
}

type TComponentProps = IProps
class TweetColumnAssigner extends React.Component<TComponentProps, {}> {
  private onAssignTweet: any

  private onUnassignTweet: any

  private onReassign: any

  private onBulkReassign: any

  public constructor(props: TComponentProps) {
    super(props)

    this.onAssignTweet = (tweetId: string, userId: number) => () => this.props.onAssignTweet(tweetId, userId)
    this.onUnassignTweet = (assignment: IReviewerAssignment) => () => this.props.onUnassignTweet(assignment)
    this.onReassign = (assignmentId: number, newReviewerId: number) => () =>
      this.props.onReassign(assignmentId, newReviewerId)
    this.onBulkReassign = (newReviewerId: number) => () =>
      this.props.onBulkReassign(this.props.currentReviewer.id, newReviewerId)
  }

  public render() {
    const { open, assignment, tweetId, currentReviewer, reviewers, reviewerAssignmentCounts, mode, onCloseAssigner } =
      this.props

    const filterOutCurrentReviewer = (reviewer: IReviewerUser) => {
      if (mode === ETweetColumnAssignerMode.ASSIGN) {
        return true
      }

      if (
        (mode === ETweetColumnAssignerMode.REASSIGN || mode === ETweetColumnAssignerMode.BULK_REASSIGN) &&
        reviewer.id !== currentReviewer.id
      ) {
        return true
      }
      return false
    }
    const onlineReviewers = reviewers.filter((reviewer: IReviewerUser) => reviewer.is_accepting_assignments === true)
    const onlineReviewersSorted = sortBy(onlineReviewers, (reviewer: IReviewerUser) => reviewer.name).filter(
      filterOutCurrentReviewer
    )
    const offlineReviewers = reviewers.filter((reviewer: IReviewerUser) => reviewer.is_accepting_assignments === false)
    const offlineReviewersSorted = sortBy(offlineReviewers, (reviewer: IReviewerUser) => reviewer.name).filter(
      filterOutCurrentReviewer
    )

    return (
      <React.Fragment>
        <Dialog open={open} onClose={onCloseAssigner} aria-labelledby="assign-tweet-dialog">
          {mode === ETweetColumnAssignerMode.ASSIGN && (
            <DialogTitle id="assign-tweet-dialog-title">Assign a tweet to a reviewer</DialogTitle>
          )}
          {mode === ETweetColumnAssignerMode.REASSIGN && (
            <DialogTitle id="assign-tweet-dialog-title">Reassign a tweet to another reviewer</DialogTitle>
          )}
          {mode === ETweetColumnAssignerMode.BULK_REASSIGN && (
            <DialogTitle id="assign-tweet-dialog-title">Reassign ALL of your tweets to another reviewer</DialogTitle>
          )}
          <div>
            <List>
              {mode === ETweetColumnAssignerMode.ASSIGN && assignment !== null && (
                <React.Fragment>
                  <ListItem button={true} onClick={this.onUnassignTweet(assignment)}>
                    <ListItemAvatar>
                      <Avatar>
                        <AssignmentReturnIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Unassign" />
                  </ListItem>
                  <Divider variant="middle" />
                </React.Fragment>
              )}
              {onlineReviewersSorted.map((reviewer: IReviewerUser) => {
                const isAssigned = assignment !== null && reviewer.id === assignment.user_id

                const secondaryText = isAssigned ? 'Assigned' : undefined

                let onClick
                if (mode === ETweetColumnAssignerMode.ASSIGN) {
                  onClick = this.onAssignTweet(tweetId, reviewer.id)
                } else if (mode === ETweetColumnAssignerMode.REASSIGN && assignment !== null) {
                  onClick = this.onReassign(assignment.id, reviewer.id)
                } else if (mode === ETweetColumnAssignerMode.BULK_REASSIGN) {
                  onClick = this.onBulkReassign(reviewer.id)
                }

                return (
                  <ListItem
                    key={reviewer.id}
                    button={true}
                    onClick={onClick}
                    style={isAssigned === true ? { backgroundColor: yellow[200] } : undefined}
                  >
                    <ListItemAvatar>
                      {isAssigned === false && (
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      )}
                      {isAssigned === true && (
                        <StyledAssignedAvatar>
                          <PersonIcon />
                        </StyledAssignedAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText primary={reviewer.name} secondary={secondaryText} />
                    <ListItemSecondaryAction>
                      <StyledBadge color="primary" badgeContent={reviewerAssignmentCounts[reviewer.id]}>
                        <AssignmentIcon />
                      </StyledBadge>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
              {onlineReviewersSorted.length > 0 && offlineReviewersSorted.length > 0 && <Divider variant="middle" />}
              {offlineReviewersSorted.map((reviewer: IReviewerUser) => {
                const isAssigned = assignment !== null && reviewer.id === assignment.user_id

                const secondaryText = isAssigned ? 'Assigned - Offline' : 'Offline'

                let onClick
                if (mode === ETweetColumnAssignerMode.ASSIGN) {
                  onClick = this.onAssignTweet(tweetId, reviewer.id)
                } else if (mode === ETweetColumnAssignerMode.REASSIGN && assignment !== null) {
                  onClick = this.onReassign(assignment.id, reviewer.id)
                } else if (mode === ETweetColumnAssignerMode.BULK_REASSIGN) {
                  onClick = this.onBulkReassign(reviewer.id)
                }

                return (
                  <ListItem
                    key={reviewer.id}
                    button={true}
                    onClick={onClick}
                    style={{
                      ...{ opacity: 0.5 },
                      ...(isAssigned === true ? { backgroundColor: yellow[200] } : undefined),
                    }}
                  >
                    <ListItemAvatar>
                      {isAssigned === false && (
                        <StyledOfflineAvatar>
                          <PowerOff />
                        </StyledOfflineAvatar>
                      )}
                      {isAssigned === true && (
                        <StyledAssignedAndOfflineAvatar>
                          <PowerOff />
                        </StyledAssignedAndOfflineAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText primary={reviewer.name} secondary={secondaryText} />
                    <ListItemSecondaryAction>
                      <StyledBadge color="primary" badgeContent={reviewerAssignmentCounts[reviewer.id]}>
                        <AssignmentIcon />
                      </StyledBadge>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          </div>
        </Dialog>
      </React.Fragment>
    )
  }
}

export default TweetColumnAssigner
