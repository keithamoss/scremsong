import { AppBar, Tab, Tabs, Theme, Typography, withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"

const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        minHeight: "100%",
        backgroundColor: theme.palette.background.paper,
    },
    tabContainer: {
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

        const TabContainer = (props: any) => (
            <Typography component="div" className={classes.tabContainer}>
                {props.children}
            </Typography>
        )

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
                    {activeTab === 0 && <TabContainer>Page One</TabContainer>}
                    {activeTab === 1 && <TabContainer>Page Two</TabContainer>}
                    {activeTab === 2 && <TabContainer>Page Three</TabContainer>}
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(AdminPanel)
