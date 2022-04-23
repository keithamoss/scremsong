import { Button, FormControl, InputLabel, MenuItem, Select, Theme, withStyles, WithStyles } from '@material-ui/core'
import CloudDownload from '@material-ui/icons/CloudDownload'
import Refresh from '@material-ui/icons/Refresh'
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
  onRefreshLogfile: any
}

export interface IState {}

type TComponentProps = IProps & WithStyles

class LogViewer extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { availableLogs, currentFilename, onChooseLogfile, onRefreshLogfile, classes } = this.props

    const logfileURL = `${getAPIBaseURL()}/0.1/logs_admin/get_log/?format=json&log_filename=${currentFilename}`

    // Split off the "&s=xxx" part of the filename we use to force refreshing
    const currentFilenameActual = currentFilename !== null ? currentFilename?.split('&')[0] : null

    return (
      <React.Fragment>
        <div className={classes.flexGrid}>
          <FormControl classes={{ root: classes.formControl }}>
            <InputLabel htmlFor="view-logfile-control">Choose a log file</InputLabel>
            <Select
              value={currentFilenameActual !== null ? currentFilenameActual : ''}
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
              className={classNames(classes.button)}
              disabled={currentFilenameActual === null}
            >
              <CloudDownload className={classNames(classes.leftIcon, classes.iconSmall)} />
              Download
            </Button>
          </a>

          <Button
            variant="contained"
            color="primary"
            className={classNames(classes.button)}
            disabled={currentFilenameActual === null}
            onClick={onRefreshLogfile}
          >
            <Refresh className={classNames(classes.leftIcon, classes.iconSmall)} />
            Rerfesh
          </Button>

          {currentFilenameActual !== null && (
            <LazyLog
              extraLines={1}
              enableSearch={true}
              caseInsensitive={true}
              url={logfileURL}
              fetchOptions={{ credentials: 'include' }}
              stream={true}
              follow={true}
              selectableLines={true}
            />
          )}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(LogViewer)
