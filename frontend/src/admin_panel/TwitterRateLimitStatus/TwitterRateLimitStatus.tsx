import { LinearProgress, Paper, Theme, Tooltip, Typography, withStyles, WithStyles } from '@material-ui/core'
import { DateTime } from 'luxon'
import * as React from 'react'
import { IRateLimitResources, IResourceRateLimit } from './types'

const styles = (theme: Theme) =>
  ({
    flexContainerTileWrap: {
      display: 'flex',
      flexFlow: 'row wrap',
      marginBottom: 25,
    },
    paper: {
      ...theme.mixins.gutters(),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      margin: 13,
    },
    flexTable: {
      display: 'flex',
      flexFlow: 'row wrap',
      maxWidth: 300,
    },
    resourceName: {
      display: 'flex',
      flex: '1 1 100%',
      width: 300,
      height: 30,
      verticalAlign: 'top',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    progressBar: {
      width: 175,
      alignSelf: 'flex-end',
    },
    timeUntilReset: {
      marginLeft: 10,
      fontSize: 14,
      flexGrow: 1,
      textAlign: 'right',
    },
  } as any)

export interface IProps {
  rateLimitResources: IRateLimitResources
}

export interface IState {}

type TComponentProps = IProps & WithStyles

class TwitterRateLimitStatus extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { rateLimitResources, classes } = this.props

    return (
      <React.Fragment>
        {Object.keys(rateLimitResources).map((resourceGroupName: string) => (
          <React.Fragment key={resourceGroupName}>
            <Typography variant="h4" gutterBottom>
              {resourceGroupName}
            </Typography>
            <div className={classes.flexContainerTileWrap}>
              {Object.keys(rateLimitResources[resourceGroupName]).map((resourceName: string) => {
                const resource: IResourceRateLimit = rateLimitResources[resourceGroupName][resourceName]

                const resetDateTime = DateTime.fromSeconds(resource.reset)

                const rateLimitConsumed = ((resource.limit - resource.remaining) / resource.limit) * 100

                return (
                  <Paper key={resourceName} className={classes.paper} elevation={1}>
                    <div className={classes.flexTable}>
                      <div className={classes.resourceName}>
                        <Tooltip title={resourceName}>
                          <span>{resourceName}</span>
                        </Tooltip>
                      </div>
                      <div className={classes.progressBar}>
                        <Tooltip title={`${resource.remaining} API calls remaining`}>
                          <LinearProgress variant="determinate" value={rateLimitConsumed} />
                        </Tooltip>
                      </div>
                      <div className={classes.timeUntilReset}>
                        resets {resetDateTime.toRelative({ padding: 1000, style: 'narrow' })}
                      </div>
                    </div>
                  </Paper>
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(TwitterRateLimitStatus)
