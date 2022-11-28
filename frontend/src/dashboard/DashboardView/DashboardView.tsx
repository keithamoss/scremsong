import { Avatar, Badge, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { IDashboardStats } from '../../redux/modules/app'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { ITriageColumn } from '../../redux/modules/triage'

const StyledRootDiv = styled('div')(() => ({
  padding: 10,
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 1100,
  marginTop: theme.spacing(3),
  overflowX: 'auto',
}))

const StyledTable = styled(Table)(() => ({
  // maxWidth: 700,
}))

const StyledAvatar = styled(Avatar)(() => ({
  float: 'left',
  marginRight: 10,
}))

const StyledBadgeOffline = styled(Badge)(() => ({
  '.MuiBadge-badge': {
    backgroundColor: '#d22727',
    color: '#d22727',
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
}))

const StyledBadgeOnline = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '1px solid currentColor',
      content: '""',
      animation: 'ripple 1.2s infinite ease-in-out',
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
}))

export interface IProps {
  stats: IDashboardStats
  users: IReviewerUser[]
  columns: ITriageColumn[]
}

export interface IState {}

type TComponentProps = IProps
class DashboardView extends React.Component<TComponentProps, IState> {
  public constructor(props: TComponentProps) {
    super(props)

    // this.state = { assignerOpen: false, assignmentId: null, tweetId: null }

    // this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
    //     this.setState({ ...this.state, ...{ assignerOpen: true, tweetId, assignmentId } })
    // }
  }

  public render() {
    const { stats, users, columns } = this.props

    return (
      <React.Fragment>
        <StyledRootDiv>
          <Typography variant="h6" gutterBottom={true}>
            Assignments
          </Typography>
          <StyledPaper>
            <StyledTable>
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
                          color="primary"
                          overlap="circular"
                          variant="dot"
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                        >
                          <Avatar src={user.profile_image_url} />
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
            </StyledTable>
          </StyledPaper>
          <br />
          <br />
          <Typography variant="h6" gutterBottom={true}>
            Triage
          </Typography>
          <StyledPaper>
            <StyledTable>
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
                            <StyledAvatar src={assignedTo.profile_image_url} />
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
            </StyledTable>
          </StyledPaper>
        </StyledRootDiv>
      </React.Fragment>
    )
  }
}

export default DashboardView
