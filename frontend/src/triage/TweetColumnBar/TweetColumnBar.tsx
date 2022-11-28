import NewReleases from '@mui/icons-material/NewReleases'
import NewReleasesOutlined from '@mui/icons-material/NewReleasesOutlined'
import { AppBar, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import { lightBlue } from '@mui/material/colors'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { isDevEnvironment } from '../../redux/modules/app'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'
import { ITriageColumn } from '../../redux/modules/triage'
import AssignerAvatarContainer from '../AssignerAvatar/AssignerAvatarContainer'

const StyledTypography = styled(Typography)(() => ({
  flexGrow: 1,
}))

const StyledIconButton = styled(IconButton)(() => ({
  color: lightBlue[500],
}))

export interface IProps {
  column: ITriageColumn
  hasBufferedTweets: boolean
  assignedToUser: IReviewerUser | undefined
  onLoadNewTweetsForColumn: any
  onAssignTriager: Function
  onUnassignTriager: Function
}

export interface IState {}

type TComponentProps = IProps
class TweetColumnBar extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { column, hasBufferedTweets, assignedToUser, onLoadNewTweetsForColumn, onAssignTriager, onUnassignTriager } =
      this.props

    return (
      <AppBar position="static">
        <Toolbar>
          <AssignerAvatarContainer
            assignedToUser={assignedToUser}
            onAssign={onAssignTriager}
            onUnassign={onUnassignTriager}
          />
          <StyledTypography variant="h6" color="inherit">
            {column.search_phrases.join(', ')}
            {isDevEnvironment() && ` (#${column.id})`}
          </StyledTypography>
          {hasBufferedTweets === false && (
            <IconButton disabled={true} size="large">
              <NewReleasesOutlined />
            </IconButton>
          )}
          {hasBufferedTweets === true && (
            <Tooltip
              title="There are new tweets in this column - click to show them"
              aria-label="This column has new tweets"
            >
              <StyledIconButton onClick={onLoadNewTweetsForColumn} data-columnid={column.id} size="large">
                <NewReleases />
              </StyledIconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
    )
  }
}

export default TweetColumnBar
