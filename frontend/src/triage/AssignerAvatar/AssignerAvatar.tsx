import { Avatar, Button, Menu, MenuItem, Theme, withStyles, WithStyles } from '@material-ui/core'
import { Person } from '@material-ui/icons'
import * as React from 'react'
import { IReviewerUser } from '../../redux/modules/interfaces.reviewers'

const styles = (_theme: Theme) => ({
  button: {
    backgroundColor: 'transparent !important',
  },
  avatar: {
    marginRight: 10,
  },
  menuItem: {
    paddingTop: 16,
    paddingBottom: 16,
  },
})

export interface IProps {
  assignedToUser: IReviewerUser | undefined
  triagers: IReviewerUser[]
  onAssign: Function
  onUnassign: Function
}

export interface IState {
  anchorEl: HTMLElement | null
}

type TComponentProps = IProps & WithStyles
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
    const { assignedToUser, triagers, classes } = this.props
    const { anchorEl } = this.state

    return (
      <React.Fragment>
        {assignedToUser === undefined && (
          <Button
            aria-owns={anchorEl ? 'simple-menu' : undefined}
            aria-haspopup="true"
            className={classes.button}
            onClick={this.handleOpenMenu}
          >
            <Avatar className={classes.avatar}>
              <Person fontSize="large" />
            </Avatar>
          </Button>
        )}
        {assignedToUser !== undefined && (
          <Button
            aria-owns={anchorEl ? 'simple-menu' : undefined}
            aria-haspopup="true"
            className={classes.button}
            onClick={this.handleOpenMenu}
          >
            <Avatar className={classes.avatar} src={assignedToUser.profile_image_url} />
          </Button>
        )}
        <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleClose}>
          {triagers.map((user: IReviewerUser) => {
            if (assignedToUser === undefined || assignedToUser.id !== user.id) {
              return (
                <MenuItem key={user.id} className={classes.menuItem} onClick={this.handleChooseItem(user.id)}>
                  <Avatar className={classes.avatar} src={user.profile_image_url} />
                  {user.name}
                </MenuItem>
              )
            }
            return null
          })}
          {assignedToUser !== undefined && (
            <MenuItem className={classes.menuItem} onClick={this.handleUnassign}>
              <Avatar className={classes.avatar}>
                <Person fontSize="large" />
              </Avatar>
              Unassign
            </MenuItem>
          )}
        </Menu>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(AssignerAvatar)
