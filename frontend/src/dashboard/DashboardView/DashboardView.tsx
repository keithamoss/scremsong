import {
  Avatar,
  Badge,
  createStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  Typography,
} from '@mui/material'
import { withStyles, WithStyles } from '@mui/styles'
import * as React from 'react'
import { IDashboardStats } from '../../redux/modules/app'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { ITriageColumn } from '../../redux/modules/triage'

const styles = (theme: Theme) =>
  ({
    root: {
      padding: 10,
    },
    paper: {
      maxWidth: 1100,
      marginTop: theme.spacing(3),
      overflowX: 'auto',
    },
    table: {
      // maxWidth: 700,
    },
    avatar: {
      float: 'left',
      marginRight: 10,
    },
  } as any)

const StyledBadgeOffline = withStyles((theme: Theme) =>
  createStyles({
    badge: {
      backgroundColor: '#d22727',
      color: '#d22727',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '1px solid currentColor',
        content: '""',
      },
    },
  })
)(Badge)

const StyledBadgeOnline = withStyles(() =>
  createStyles({
    badge: {
      backgroundColor: '#44b700',
      color: '#44b700',
      '&::after': {
        animation: '$ripple 1.2s infinite ease-in-out',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  })
)(StyledBadgeOffline)

export interface IProps {
  stats: IDashboardStats
  users: IReviewerUser[]
  columns: ITriageColumn[]
}

export interface IState {}

type TComponentProps = IProps & WithStyles<typeof styles>
class DashboardView extends React.Component<TComponentProps, IState> {
  public constructor(props: TComponentProps) {
    super(props)

    // this.state = { assignerOpen: false, assignmentId: null, tweetId: null }

    // this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
    //     this.setState({ ...this.state, ...{ assignerOpen: true, tweetId, assignmentId } })
    // }
  }

  public render() {
    const { stats, users, columns, classes } = this.props

    return (
      <React.Fragment>
        <div className={classes.root}>
          <Typography variant="h6" gutterBottom={true}>
            Assignments
          </Typography>
          <Paper className={classes.paper}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell align="right">In Progress</TableCell>
                  <TableCell align="right">Awaiting Reply</TableCell>
                  <TableCell align="right">Map Updated</TableCell>
                  <TableCell align="right">No Change Required</TableCell>
                  <TableCell align="right">Not Relevant</TableCell>
                  <TableCell align="right">Not Actioned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(stats.assignments.past_week).map((userId: string) => {
                  const userStats = stats.assignments.past_week[userId]
                  const user = users.find((u: IReviewerUser) => u.id === parseInt(userId, 10))!

                  const StyledBadge = user.is_accepting_assignments ? StyledBadgeOnline : StyledBadgeOffline

                  return (
                    <TableRow key={userId}>
                      <TableCell>
                        <StyledBadge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          variant="dot"
                        >
                          <Avatar className={classes.avatar} src={user.profile_image_url} />
                        </StyledBadge>
                      </TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell align="right">{userStats.Pending}</TableCell>
                      <TableCell align="right">{userStats['Awaiting Reply']}</TableCell>
                      <TableCell align="right">{userStats['Map Updated']}</TableCell>
                      <TableCell align="right">{userStats['No Change Required']}</TableCell>
                      <TableCell align="right">{userStats['Not Relevant']}</TableCell>
                      <TableCell align="right">{userStats['Not Actioned']}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>
          <br />
          <br />
          <Typography variant="h6" gutterBottom={true}>
            Triage
          </Typography>
          <Paper className={classes.paper}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="right">Untriaged</TableCell>
                  <TableCell align="right">Assigned</TableCell>
                  <TableCell align="right">Dealt With</TableCell>
                  <TableCell align="right">Dismissed</TableCell>
                  <TableCell align="right">Not Actioned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(stats.triage.past_week).map((columnId: string) => {
                  const column = columns.find((c: ITriageColumn) => c.id === parseInt(columnId, 10))
                  const assignedTo = users.find((u: IReviewerUser) => u.id === column!.assigned_to)

                  return (
                    <TableRow key={columnId}>
                      <TableCell component="th" scope="row">
                        {column!.search_phrases.join(' ')}
                      </TableCell>
                      <TableCell>
                        {assignedTo !== undefined ? (
                          <React.Fragment>
                            <Avatar className={classes.avatar} src={assignedTo.profile_image_url} />
                            {assignedTo.name}
                          </React.Fragment>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell align="right">{stats.triage.past_week[columnId]['TweetState.ACTIVE']}</TableCell>
                      <TableCell align="right">{stats.triage.past_week[columnId]['TweetState.ASSIGNED']}</TableCell>
                      <TableCell align="right">{stats.triage.past_week[columnId]['TweetState.DEALT_WITH']}</TableCell>
                      <TableCell align="right">{stats.triage.past_week[columnId]['TweetState.DISMISSED']}</TableCell>
                      <TableCell align="right">{stats.triage.past_week[columnId]['TweetState.NOT_ACTIONED']}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(DashboardView)
