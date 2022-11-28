import AssignmentInd from '@mui/icons-material/AssignmentInd'
import Power from '@mui/icons-material/Power'
import PowerOff from '@mui/icons-material/PowerOff'
import { AppBar, Button, FormControl, Input, InputLabel, Tooltip, Typography } from '@mui/material'
import { deepOrange } from '@mui/material/colors'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { styled } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import * as React from 'react'
import { IReviewerAssignment, IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { EQueueSortBy, IProfileSettings } from '../../redux/modules/user'
import TweetColumnAssignerContainer, {
  ETweetColumnAssignerMode,
} from '../../triage/TweetColumnAssigner/TweetColumnAssignerContainer'
import ReviewCardContainer from '../ReviewCard/ReviewCardContainer'

const StyledInputLabel = styled(InputLabel)(() => ({
  color: 'white',
}))

const StyledSelect = styled(Select)(() => ({
  '&': { color: 'white' },
  '&::before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  '&:hover::before': {
    borderColor: 'white !important',
  },
  '.MuiSelect-icon': {
    fill: 'white',
  },
}))

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 165,
  paddingRight: theme.spacing(3),
}))

const StyledTypography = styled(Typography)(() => ({
  flexGrow: 1,
}))

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
}))

const StyledReviewContainerDiv = styled('div')(() => ({
  display: 'inline-block',
  padding: 10,
}))

export interface IProps {
  assignments: IReviewerAssignment[]
  reviewers: IReviewerUser[]
  currentReviewer: IReviewerUser
  userSettings: IProfileSettings
  onChangeQueueUser: any
  onChangeQueueSortOrder: any
  onToggleUserOnlineStatus: any
}

export interface IState {
  assignerOpen: boolean
}

type TComponentProps = IProps

class UserReviewQueueView extends React.PureComponent<TComponentProps, IState> {
  private onOpenAssigner: any

  private onCloseAssigner: any

  private onChangeQueueUser: any

  private onChangeQueueSortOrder: any

  private onToggleUserOnlineStatus: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { assignerOpen: false }

    this.onOpenAssigner = () => {
      this.setState({ assignerOpen: true })
    }

    this.onCloseAssigner = () => {
      this.setState({ assignerOpen: false })
    }

    this.onChangeQueueUser = (event: React.ChangeEvent<HTMLSelectElement>) => {
      props.onChangeQueueUser(event.target.value)
    }
    this.onChangeQueueSortOrder = (event: React.ChangeEvent<HTMLSelectElement>) => {
      props.onChangeQueueSortOrder(event.target.value)
    }
    this.onToggleUserOnlineStatus = (_event: React.MouseEvent<HTMLElement>) => {
      props.onToggleUserOnlineStatus(this.props.currentReviewer)
    }
  }

  public render() {
    const { assignments, reviewers, currentReviewer, userSettings } = this.props
    const { assignerOpen } = this.state

    return (
      <React.Fragment>
        <TweetColumnAssignerContainer
          open={assignerOpen}
          assignmentId={null}
          tweetId={null}
          mode={ETweetColumnAssignerMode.BULK_REASSIGN}
          onCloseAssigner={this.onCloseAssigner}
        />
        <AppBar position="static">
          <Toolbar>
            <StyledFormControl>
              <StyledInputLabel htmlFor="queue-user-control" variant="standard">
                Viewing the queue for
              </StyledInputLabel>
              <StyledSelect
                value={currentReviewer.id}
                onChange={this.onChangeQueueUser}
                inputProps={{
                  name: 'queue-user',
                  id: 'queue-user-control',
                }}
                input={<Input />}
              >
                {reviewers.map((reviewer: IReviewerUser) => (
                  <MenuItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name}
                  </MenuItem>
                ))}
              </StyledSelect>
            </StyledFormControl>

            <StyledFormControl>
              <StyledInputLabel htmlFor="queue-sort-order-control" variant="standard">
                Sort queue by
              </StyledInputLabel>
              <StyledSelect
                value={userSettings.queue_sort_by}
                onChange={this.onChangeQueueSortOrder}
                inputProps={{
                  name: 'queue-sort-order',
                  id: 'queue-sort-order-control',
                }}
                input={<Input />}
              >
                <MenuItem value={EQueueSortBy.ByCreation}>When they were assigned</MenuItem>
                <MenuItem value={EQueueSortBy.ByModified}>When they were last updated</MenuItem>
              </StyledSelect>
            </StyledFormControl>

            <StyledTypography variant="h6" color="inherit" />

            {assignments.length > 0 && (
              <Tooltip title="Reassign all of your tweets to somebody else">
                <StyledButton
                  variant="contained"
                  color="info"
                  startIcon={<AssignmentInd />}
                  onClick={this.onOpenAssigner}
                >
                  Bulk reassign
                </StyledButton>
              </Tooltip>
            )}

            <Tooltip title="Let us know if you're available to receive tweets">
              <StyledButton
                variant="contained"
                color="info"
                startIcon={currentReviewer.is_accepting_assignments ? <Power /> : <PowerOff />}
                sx={[
                  { backgroundColor: currentReviewer.is_accepting_assignments === true ? '' : deepOrange[500] },
                  {
                    '&:hover': {
                      backgroundColor: deepOrange[700],
                    },
                  },
                ]}
                onClick={this.onToggleUserOnlineStatus}
              >
                {currentReviewer.is_accepting_assignments ? 'Online' : 'Offline'}
              </StyledButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <StyledReviewContainerDiv>
          {assignments.map((assignment: IReviewerAssignment) => (
            <ReviewCardContainer key={assignment.id} assignment={assignment} />
          ))}
        </StyledReviewContainerDiv>
      </React.Fragment>
    )
  }
}

export default UserReviewQueueView
