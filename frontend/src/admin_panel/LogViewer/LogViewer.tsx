import CloudDownload from '@mui/icons-material/CloudDownload'
import Refresh from '@mui/icons-material/Refresh'
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { styled } from '@mui/material/styles'
import * as React from 'react'
import { LazyLog } from 'react-lazylog'
import { getAPIBaseURL } from '../../redux/modules/app'

const StyledFlexGrid = styled('div')(() => ({
  // display: "flex",
  minHeight: '95%',
}))

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 165,
  maxWidth: 240,
  paddingRight: theme.spacing(3),
}))

const StyledAnchor = styled('a')(() => ({
  textDecoration: 'none',
  marginRight: '20px',
}))

export interface IProps {
  availableLogs: string[]
  currentFilename: string | null
  onChooseLogfile: any
  onRefreshLogfile: any
}

export interface IState {}

type TComponentProps = IProps

class LogViewer extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { availableLogs, currentFilename, onChooseLogfile, onRefreshLogfile } = this.props

    const logfileURL = `${getAPIBaseURL()}/0.1/logs_admin/get_log/?format=json&log_filename=${currentFilename}`

    // Split off the "&s=xxx" part of the filename we use to force refreshing
    const currentFilenameActual = currentFilename !== null ? currentFilename?.split('&')[0] : null

    return (
      <React.Fragment>
        <StyledFlexGrid>
          <StyledFormControl fullWidth>
            <InputLabel htmlFor="view-logfile-control">Choose a log file</InputLabel>
            <Select
              labelId="view-logfile-control"
              name="view-logfile"
              value={currentFilenameActual !== null ? currentFilenameActual : ''}
              label="Choose a log file"
              onChange={onChooseLogfile}
            >
              {availableLogs.map((filename: string) => (
                <MenuItem key={filename} value={filename}>
                  {filename}
                </MenuItem>
              ))}
            </Select>
          </StyledFormControl>

          <StyledAnchor href={`${logfileURL}&download=1`}>
            <Button variant="contained" startIcon={<CloudDownload />} disabled={currentFilenameActual === null}>
              Download
            </Button>
          </StyledAnchor>

          <Button
            variant="contained"
            startIcon={<Refresh />}
            disabled={currentFilenameActual === null}
            onClick={onRefreshLogfile}
          >
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
        </StyledFlexGrid>
      </React.Fragment>
    )
  }
}

export default LogViewer
