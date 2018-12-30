import { withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import { ITriageColumn } from "../../redux/modules/triage"
import TweetColumnAssignerContainer, { eTweetColumnAssignerMode } from "../../triage/TweetColumnAssigner/TweetColumnAssignerContainer"
import TweetColumnContainer from "../TweetColumn/TweetColumnContainer"
import TweetColumnBarContainer from "../TweetColumnBar/TweetColumnBarContainer"
import TweetColumnReplierContainer from "../TweetColumnReplier/TweetColumnReplierContainer"

const styles = () =>
    ({
        columnContainerContainer: {
            display: "inline-block",
            height: "100%",
            "& .tweet": {
                width: "370px !important",
                minHeight: "123px !important", // Height of the ActionBar
                display: "inline-block !important",
            },
        },
        columnContainer: {
            display: "flex",
            flexDirection: "row",
            height: "100%",
        },
        column: {
            width: "420px",
            height: "100%",
            marginRight: "5px",
        },
    } as any)

export interface IProps {
    columns: ITriageColumn[]
}

export interface IState {
    assignerOpen: boolean
    replierOpen: boolean
    tweetId: string | null
    assignmentId: number | null
}

type TComponentProps = IProps & WithStyles
class TriageView extends React.Component<TComponentProps, IState> {
    private onOpenAssigner: any
    private onCloseAssigner: any
    private onOpenReplier: any
    private onCloseReplier: any

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { assignerOpen: false, replierOpen: false, assignmentId: null, tweetId: null }

        this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
            this.setState({ ...this.state, ...{ assignerOpen: true, tweetId, assignmentId } })
        }
        this.onCloseAssigner = () => {
            this.setState({ ...this.state, ...{ assignerOpen: false, tweetId: null, assignmentId: null } })
        }

        this.onOpenReplier = (tweetId: string) => {
            this.setState({ ...this.state, ...{ replierOpen: true, tweetId } })
        }
        this.onCloseReplier = () => {
            this.setState({ ...this.state, ...{ replierOpen: false, tweetId: null } })
        }
    }
    public render() {
        const { columns, classes } = this.props
        const { assignerOpen, replierOpen, assignmentId, tweetId } = this.state

        return (
            <React.Fragment>
                <TweetColumnAssignerContainer
                    open={assignerOpen}
                    assignmentId={assignmentId}
                    tweetId={tweetId}
                    mode={eTweetColumnAssignerMode.ASSIGN}
                    onCloseAssigner={this.onCloseAssigner}
                />
                <TweetColumnReplierContainer open={replierOpen} tweetId={tweetId!} onCloseReplier={this.onCloseReplier} />
                <div className={classes.columnContainerContainer}>
                    <div className={classes.columnContainer}>
                        {columns.map((column: ITriageColumn, key: number) => (
                            <div key={column.id} className={classes.column}>
                                <TweetColumnBarContainer column={column} />
                                <TweetColumnContainer
                                    column={column}
                                    onOpenAssigner={this.onOpenAssigner}
                                    onOpenReplier={this.onOpenReplier}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(TriageView)
