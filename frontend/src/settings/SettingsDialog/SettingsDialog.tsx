import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Theme,
  Typography,
} from '@mui/material'
import { withStyles, WithStyles } from '@mui/styles'
import * as React from 'react'
import { IProfileSettings } from '../../redux/modules/user'

export interface IProps {
  settings: IProfileSettings
  open: boolean
  onChangeSetting: Function
  onCloseDialog: Function
}

export interface IState {
  expanded: string | null
}

const styles = (theme: Theme) =>
  ({
    disconnectedButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
    },
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      flexBasis: '33.33%',
      flexShrink: 0,
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
  } as any)

type TComponentProps = IProps & WithStyles<typeof styles>
class SettingsDialog extends React.PureComponent<TComponentProps, IState> {
  private handleChange: any

  private onChangeSetting: any

  private handleClose: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = {
      expanded: 'triage_panel',
    }

    this.handleChange = (panel: string) => (_event: React.MouseEvent<HTMLElement>, expanded: boolean) => {
      this.setState({
        expanded: expanded ? panel : null,
      })
    }

    this.onChangeSetting = (settingName: string) => (_event: React.MouseEvent<HTMLElement>, value: any) => {
      this.props.onChangeSetting(settingName, value)
    }

    this.handleClose = (_event: React.MouseEvent<HTMLElement>) => {
      this.props.onCloseDialog()
    }
  }

  public render() {
    const { settings, open, classes } = this.props
    const { expanded } = this.state

    return (
      <Dialog
        aria-labelledby="settings-dialog-title"
        open={open}
        onClose={this.handleClose}
        fullWidth={true}
        maxWidth="lg"
      >
        <DialogTitle id="settings-dialog-title">Settings</DialogTitle>
        <DialogContent>
          <Accordion expanded={expanded === 'triage_panel'} onChange={this.handleChange('triage_panel')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className={classes.heading}>Triage</Typography>
              <Typography className={classes.secondaryHeading}>Settings for folks on triage duty</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List className={classes.root}>
                <ListItem>
                  <ListItemIcon>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Only show triage columns that are assigned to you"
                    secondary="Use this to hide the clutter and focus on just the columns you need to triage"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      onChange={this.onChangeSetting('triage_only_show_assigned_columns')}
                      checked={settings.triage_only_show_assigned_columns}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withStyles(styles)(SettingsDialog)
