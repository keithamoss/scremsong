import { Person } from '@mui/icons-material'
import { Avatar, Button, Menu, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'

const StyledAvatar = styled(Avatar)(() => ({
  marginRight: 10,
}))

export interface IProps {
  assignedToUser: IReviewerUser | undefined
  triagers: IReviewerUser[]
  onAssign: Function
  onUnassign: Function
}

export interface IState {
  anchorEl: HTMLElement | null
}

type TComponentProps = IProps
class AssignerAvatar extends React.PureComponent<TComponentProps, IState> {
  private handleOpenMenu: any

  private handleChooseItem: any

  private handleUnassign: any

  private handleClose: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = {
      anchorEl: null,
    }

    this.handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
      this.setState({ anchorEl: event.currentTarget })
    }

    this.handleChooseItem = (userId: number) => (_event: React.MouseEvent<HTMLElement>) => {
      this.props.onAssign(userId)
      this.handleClose()
      // console.log(this.state)
      // this.setState({ anchorEl: null })
    }

    this.handleUnassign = () => {
      this.props.onUnassign()
      this.handleClose()
      // console.log(this.state)
      // this.setState({ anchorEl: null })
    }

    this.handleClose = () => {
      this.setState({ anchorEl: null })
    }
  }

  public render() {
    const { assignedToUser, triagers } = this.props
    const { anchorEl } = this.state

    return (
      <React.Fragment>
        {assignedToUser === undefined && (
          <Button aria-owns={anchorEl ? 'simple-menu' : undefined} aria-haspopup="true" onClick={this.handleOpenMenu}>
            <Avatar>
              <Person fontSize="large" />
            </Avatar>
          </Button>
        )}
        {assignedToUser !== undefined && (
          <Button aria-owns={anchorEl ? 'simple-menu' : undefined} aria-haspopup="true" onClick={this.handleOpenMenu}>
            <StyledAvatar src={assignedToUser.profile_image_url} />
          </Button>
        )}
        <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleClose}>
          {triagers.map((user: IReviewerUser) => {
            if (assignedToUser === undefined || assignedToUser.id !== user.id) {
              return (
                <MenuItem key={user.id} onClick={this.handleChooseItem(user.id)}>
                  <StyledAvatar src={user.profile_image_url} />
                  {user.name}
                </MenuItem>
              )
            }
            return null
          })}
          {assignedToUser !== undefined && (
            <MenuItem onClick={this.handleUnassign}>
              <StyledAvatar>
                <Person fontSize="large" />
              </StyledAvatar>
              Unassign
            </MenuItem>
          )}
        </Menu>
      </React.Fragment>
    )
  }
}

export default AssignerAvatar
