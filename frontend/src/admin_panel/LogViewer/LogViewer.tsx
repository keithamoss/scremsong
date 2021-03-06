import { Button, FormControl, InputLabel, MenuItem, Select, Theme, withStyles, WithStyles } from '@material-ui/core'
import CloudDownload from '@material-ui/icons/CloudDownload'
import classNames from 'classnames'
import * as React from 'react'
import { LazyLog } from 'react-lazylog'
import { getAPIBaseURL } from '../../redux/modules/app'

const styles = (theme: Theme) => ({
  flexGrid: {
    // display: "flex",
    minHeight: '95%',
  },
  flexCol: {
    flex: 1,
  },
  formControl: {
    minWidth: 165,
    paddingRight: theme.spacing(3),
  },
  anchor: {
    textDecoration: 'none',
  },
  button: {
    margin: theme.spacing(1),
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
})

export interface IProps {
  availableLogs: string[]
  currentFilename: string | null
  onChooseLogfile: any
}

export interface IState {}

type TComponentProps = IProps & WithStyles

class LogViewer extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { availableLogs, currentFilename, onChooseLogfile, classes } = this.props

    const logfileURL = `${getAPIBaseURL()}/0.1/logs_admin/get_log/?format=json&log_filename=${currentFilename}`

    return (
      <React.Fragment>
        <div className={classes.flexGrid}>
          <FormControl classes={{ root: classes.formControl }}>
            <InputLabel htmlFor="view-logfile-control">Choose a log file</InputLabel>
            <Select
              value={currentFilename !== null ? currentFilename : ''}
              onChange={onChooseLogfile}
              inputProps={{
                name: 'view-logfile',
                id: 'view-logfile-control',
              }}
            >
              {availableLogs.map((filename: string) => (
                <MenuItem key={filename} value={filename}>
                  {filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <a href={`${logfileURL}&download=1`} className={classes.anchor}>
            <Button
              variant="contained"
              color="primary"
              className={classNames(classes.button, classes.restartStreamingButton)}
              disabled={currentFilename === null}
            >
              <CloudDownload className={classNames(classes.leftIcon, classes.iconSmall)} />
              Download
            </Button>
          </a>

          {currentFilename !== null && (
            <LazyLog url={logfileURL} fetchOptions={{ credentials: 'include' }} follow selectableLines />
          )}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(LogViewer)
