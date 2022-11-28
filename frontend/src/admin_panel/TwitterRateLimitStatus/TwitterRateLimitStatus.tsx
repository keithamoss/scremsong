import { LinearProgress, Paper, Tooltip, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { DateTime } from 'luxon'
import * as React from 'react'
import { IRateLimitResources, IResourceRateLimit } from './types'

const StyledFlexContainerTileWrap = styled('div')(() => ({
  display: 'flex',
  flexFlow: 'row wrap',
  marginBottom: 25,
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  margin: 13,
}))

const StyledFlexTable = styled('div')(() => ({
  display: 'flex',
  flexFlow: 'row wrap',
  maxWidth: 300,
}))

const StyledResourceName = styled('div')(() => ({
  display: 'flex',
  flex: '1 1 100%',
  width: 300,
  height: 30,
  verticalAlign: 'top',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}))

const StyledProgressBar = styled('div')(() => ({
  width: 175,
  alignSelf: 'flex-end',
}))

const StyledTimeUntilReset = styled('div')(() => ({
  marginLeft: 10,
  fontSize: 14,
  flexGrow: 1,
  textAlign: 'right',
}))

export interface IProps {
  rateLimitResources: IRateLimitResources
}

export interface IState {}

type TComponentProps = IProps

class TwitterRateLimitStatus extends React.PureComponent<TComponentProps, IState> {
  public render() {
    const { rateLimitResources } = this.props

    return (
      <React.Fragment>
        {Object.keys(rateLimitResources).map((resourceGroupName: string) => (
          <React.Fragment key={resourceGroupName}>
            <Typography variant="h4" gutterBottom>
              {resourceGroupName}
            </Typography>
            <StyledFlexContainerTileWrap>
              {Object.keys(rateLimitResources[resourceGroupName]).map((resourceName: string) => {
                const resource: IResourceRateLimit = rateLimitResources[resourceGroupName][resourceName]

                const resetDateTime = DateTime.fromSeconds(resource.reset)

                const rateLimitConsumed = ((resource.limit - resource.remaining) / resource.limit) * 100

                return (
                  <StyledPaper key={resourceName} elevation={1}>
                    <StyledFlexTable>
                      <StyledResourceName>
                        <Tooltip title={resourceName}>
                          <span>{resourceName}</span>
                        </Tooltip>
                      </StyledResourceName>
                      <StyledProgressBar>
                        <Tooltip title={`${resource.remaining} API calls remaining`}>
                          <LinearProgress variant="determinate" value={rateLimitConsumed} color="secondary" />
                        </Tooltip>
                      </StyledProgressBar>
                      <StyledTimeUntilReset>
                        resets {resetDateTime.toRelative({ padding: 1000, style: 'narrow' })}
                      </StyledTimeUntilReset>
                    </StyledFlexTable>
                  </StyledPaper>
                )
              })}
            </StyledFlexContainerTileWrap>
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  }
}

export default TwitterRateLimitStatus
