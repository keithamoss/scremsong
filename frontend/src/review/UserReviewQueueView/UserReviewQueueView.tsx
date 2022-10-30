import AssignmentInd from '@material-ui/icons/AssignmentInd'
import Power from '@material-ui/icons/Power'
import PowerOff from '@material-ui/icons/PowerOff'
import { AppBar, Button, FormControl, Input, InputLabel, Theme, Tooltip, Typography } from '@mui/material'
import { deepOrange } from '@mui/material/colors'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Toolbar from '@mui/material/Toolbar'
import { withStyles, WithStyles } from '@mui/styles'
import classNames from 'classnames'
import * as React from 'react'
import { IReviewerAssignment, IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { EQueueSortBy, IProfileSettings } from '../../redux/modules/user'
import TweetColumnAssignerContainer, {
  ETweetColumnAssignerMode,
} from '../../triage/TweetColumnAssigner/TweetColumnAssignerContainer'
import ReviewCardContainer from '../ReviewCard/ReviewCardContainer'

const styles = (theme: Theme) => ({
  white: {
    color: theme.palette.common.white,
  },
  formControl: {
    minWidth: 165,
    paddingRight: theme.spacing(3),
  },
  focusedInputLabel: {
    color: 'white !important',
  },
  underline: {
    '&:before': {
      borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    },
    '&:hover:not($disabled)::before': {
      borderBottomColor: 'rgba(255, 255, 255, 0.87) !important',
    },
    '&:after': {
      borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    },
  },
  disabled: {},
  grow: {
    flexGrow: 1,
  },
  button: {
    margin: theme.spacing(1),
  },
  buttonOffline: {
    margin: theme.spacing(1),
    backgroundColor: deepOrange[500],
    '&:hover:not($disabled)': {
      backgroundColor: deepOrange[700],
    },
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
  reviewerContainer: {
    display: 'inline-block',
    padding: 10,
  },
})

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

type TComponentProps = IProps & WithStyles<typeof styles>

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
    const { assignments, reviewers, currentReviewer, userSettings, classes } = this.props
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
            <FormControl classes={{ root: classes.formControl }}>
              <InputLabel
                htmlFor="queue-user-control"
                classes={{ root: classes.white, focused: classes.focusedInputLabel }}
              >
                Viewing the queue for
              </InputLabel>
              <Select
                value={currentReviewer.id}
                onChange={this.onChangeQueueUser}
                inputProps={{
                  name: 'queue-user',
                  id: 'queue-user-control',
                }}
                // classes={{ root: classes.white, icon: classes.white }}
                classes={{ icon: classes.white }}
                input={
                  <Input
                    classes={{
                      underline: classes.underline,
                    }}
                  />
                }
              >
                {reviewers.map((reviewer: IReviewerUser) => (
                  <MenuItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl classes={{ root: classes.formControl }}>
              <InputLabel
                htmlFor="queue-sort-order-control"
                classes={{ root: classes.white, focused: classes.focusedInputLabel }}
              >
                Sort queue by
              </InputLabel>
              <Select
                value={userSettings.queue_sort_by}
                onChange={this.onChangeQueueSortOrder}
                inputProps={{
                  name: 'queue-sort-order',
                  id: 'queue-sort-order-control',
                }}
                // classes={{ root: classes.white, icon: classes.white }}
                classes={{ icon: classes.white }}
                input={
                  <Input
                    classes={{
                      underline: classes.underline,
                    }}
                  />
                }
              >
                <MenuItem value={EQueueSortBy.ByCreation}>When they were assigned</MenuItem>
                <MenuItem value={EQueueSortBy.ByModified}>When they were last updated</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="h6" color="inherit" className={classes.grow} />
            {assignments.length > 0 && (
              <Tooltip title="Reassign all of your tweets to somebody else">
                <Button variant="contained" color="primary" className={classes.button} onClick={this.onOpenAssigner}>
                  <AssignmentInd className={classNames(classes.leftIcon, classes.iconSmall)} />
                  Bulk reassign
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Let us know if you're available to receive tweets">
              <Button
                variant="contained"
                color="primary"
                className={currentReviewer.is_accepting_assignments === true ? classes.button : classes.buttonOffline}
                onClick={this.onToggleUserOnlineStatus}
              >
                {currentReviewer.is_accepting_assignments ? (
                  <Power className={classNames(classes.leftIcon, classes.iconSmall)} />
                ) : (
                  <PowerOff className={classNames(classes.leftIcon, classes.iconSmall)} />
                )}
                {currentReviewer.is_accepting_assignments ? 'Online' : 'Offline'}
              </Button>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <div className={classes.reviewerContainer}>
          {assignments.map((assignment: IReviewerAssignment) => (
            <ReviewCardContainer key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(UserReviewQueueView)
