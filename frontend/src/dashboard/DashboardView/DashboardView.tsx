import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import { IDashboardStats } from "../../redux/modules/app"
import { IReviewerUser } from "../../redux/modules/reviewers"
import { ITriageColumn } from "../../redux/modules/triage"

const styles = (theme: Theme) =>
    ({
        root: {
            padding: 10,
        },
        paper: {
            maxWidth: 800,
            marginTop: theme.spacing.unit * 3,
            overflowX: "auto",
        },
        table: {
            // maxWidth: 700,
        },
    } as any)

export interface IProps {
    stats: IDashboardStats
    users: IReviewerUser[]
    columns: ITriageColumn[]
}

export interface IState {}

type TComponentProps = IProps & WithStyles
class DashboardView extends React.Component<TComponentProps, IState> {
    public constructor(props: TComponentProps) {
        super(props)

        // this.state = { assignerOpen: false, assignmentId: null, tweetId: null }

        // this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
        //     this.setState({ ...this.state, ...{ assignerOpen: true, tweetId, assignmentId } })
        // }
    }

    public render() {
        const { stats, users, columns, classes } = this.props

        return (
            <React.Fragment>
                <div className={classes.root}>
                    <Typography variant="h6" gutterBottom={true}>
                        Assignments
                    </Typography>
                    <Paper className={classes.paper}>
                        <Table className={classes.table}>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell align="right">In Progress</TableCell>
                                    <TableCell align="right">Awaiting Reply</TableCell>
                                    <TableCell align="right">Map Updated</TableCell>
                                    <TableCell align="right">No Change Required</TableCell>
                                    <TableCell align="right">Not Relevant</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(stats.assignments.past_week).map((userId: string) => {
                                    const userStats = stats.assignments.past_week[userId]
                                    const user = users.find((u: IReviewerUser) => u.id === parseInt(userId, 10))

                                    return (
                                        <TableRow key={userId}>
                                            <TableCell component="th" scope="row">
                                                {user!.name}
                                            </TableCell>
                                            <TableCell align="right">{userStats.Pending}</TableCell>
                                            <TableCell align="right">{userStats["Awaiting Reply"]}</TableCell>
                                            <TableCell align="right">{userStats["Map Updated"]}</TableCell>
                                            <TableCell align="right">{userStats["No Change Required"]}</TableCell>
                                            <TableCell align="right">{userStats["Not Relevant"]}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                    <br />
                    <br />
                    <Typography variant="h6" gutterBottom={true}>
                        Triage
                    </Typography>
                    <Paper className={classes.paper}>
                        <Table className={classes.table}>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell align="right">Untriaged Tweets</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(stats.triage.untriaged_tweets.past_week).map((columnId: string) => {
                                    const column = columns.find((c: ITriageColumn) => c.id === parseInt(columnId, 10))
                                    const assignedTo = users.find((u: IReviewerUser) => u.id === column!.assigned_to)

                                    return (
                                        <TableRow key={columnId}>
                                            <TableCell component="th" scope="row">
                                                {column!.search_phrases.join(" ")}
                                            </TableCell>
                                            <TableCell>{assignedTo !== undefined ? assignedTo.name : ""}</TableCell>
                                            <TableCell align="right">{stats.triage.untriaged_tweets.past_week[columnId]}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(DashboardView)
