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
  Typography,
} from '@mui/material'
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

type TComponentProps = IProps
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

    this.onChangeSetting = (settingName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      this.props.onChangeSetting(settingName, event.target.checked)
    }

    this.handleClose = (_event: React.MouseEvent<HTMLElement>) => {
      this.props.onCloseDialog()
    }
  }

  public render() {
    const { settings, open } = this.props
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
              <Typography>Settings for folks on triage duty</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
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

export default SettingsDialog
