import { withStyles, WithStyles } from "@material-ui/core"
import * as React from "react"
import { ITriageColumn } from "../../redux/modules/triage"
import TweetColumnAssignerContainer from "../../triage/TweetColumnAssigner/TweetColumnAssignerContainer"
import TweetColumnContainer from "../TweetColumn/TweetColumnContainer"

const styles = () =>
    ({
        columnContainerContainer: {
            display: "inline-block",
            height: "100%",
        },
        columnContainer: {
            display: "flex",
            flexDirection: "row",
            height: "88%",
        },
    } as any)

export interface IProps {
    columns: ITriageColumn[]
}

export interface IState {
    assignerOpen: boolean
    tweetId: string | null
    assignmentId: number | null
}

type TComponentProps = IProps & WithStyles
class TriageView extends React.Component<TComponentProps, IState> {
    private onOpenAssigner: any
    private onCloseAssigner: any
    public constructor(props: TComponentProps) {
        super(props)

        this.state = { assignerOpen: false, assignmentId: null, tweetId: null }

        this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
            this.setState({ assignerOpen: true, tweetId, assignmentId })
        }
        this.onCloseAssigner = () => {
            this.setState({ assignerOpen: false, tweetId: null, assignmentId: null })
        }
    }
    public render() {
        const { columns, classes } = this.props
        const { tweetId, assignmentId, assignerOpen } = this.state

        return (
            <React.Fragment>
                <TweetColumnAssignerContainer
                    open={assignerOpen}
                    assignmentId={assignmentId}
                    tweetId={tweetId}
                    onCloseAssigner={this.onCloseAssigner}
                />
                <div className={classes.columnContainerContainer}>
                    <div className={classes.columnContainer}>
                        {columns.map((column: ITriageColumn, key: number) => (
                            <TweetColumnContainer key={column.id} column={column} onOpenAssigner={this.onOpenAssigner} />
                        ))}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default withStyles(styles)(TriageView)
