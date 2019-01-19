import { AppBar, Tab, Tabs, Theme, withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import LogViewerContainer from "../LogViewer/LogViewerContainer"
import RealTimeTweetStreamingContainer from "../RealTimeTweetStreaming/RealTimeTweetStreamingContainer"
import TwitterRateLimitStatusContainer from "../TwitterRateLimitStatus/TwitterRateLimitStatusContainer"

const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        height: "100%",
        backgroundColor: theme.palette.background.paper,
    },
    tabContainer: {
        height: "100%",
        padding: theme.spacing.unit * 3,
    },
})

export interface IProps {}

export interface IState {
    activeTab: number
}

type TComponentProps = IProps & WithStyles

class AdminPanel extends React.PureComponent<TComponentProps, IState> {
    private handleChange: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = {
            activeTab: 0,
        }

        this.handleChange = (event: React.MouseEvent<HTMLElement>, value: number) => {
            this.setState({ activeTab: value })
        }
    }

    public render() {
        const { classes } = this.props
        const { activeTab } = this.state

        const TabContainer = (props: any) => <div className={classes.tabContainer}>{props.children}</div>

        return (
            <React.Fragment>
                <div className={classes.root}>
                    <AppBar position="static">
                        <Tabs value={activeTab} onChange={this.handleChange}>
                            <Tab label="Twitter rate limits" />
                            <Tab label="Real-time Tweet Streaming" />
                            <Tab label="Log viewer" />
                        </Tabs>
                    </AppBar>
                    {activeTab === 0 && (
                        <TabContainer>
                            <TwitterRateLimitStatusContainer />
                        </TabContainer>
                    )}
                    {activeTab === 1 && (
                        <TabContainer>
                            <RealTimeTweetStreamingContainer />
                        </TabContainer>
                    )}
                    {activeTab === 2 && (
                        <TabContainer>
                            <LogViewerContainer />
                        </TabContainer>
                    )}
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(AdminPanel)
