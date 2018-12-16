import { withStyles } from "@material-ui/core"
import * as React from "react"
import { IReviewerAssignment } from "../../redux/modules/reviewers"
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
    classes: any
}

export interface IState {
    assignerOpen: boolean
    tweetId: string | null
    assignment: IReviewerAssignment | null
}

class TriageView extends React.Component<IProps, IState> {
    private onOpenAssigner: any
    private onCloseAssigner: any
    public constructor(props: IProps) {
        super(props)

        this.state = { assignerOpen: false, assignment: null, tweetId: null }

        this.onOpenAssigner = (tweetId: string, assignment: IReviewerAssignment | null) => {
            this.setState({ assignerOpen: true, tweetId, assignment })
        }
        this.onCloseAssigner = () => {
            this.setState({ assignerOpen: false, tweetId: null, assignment: null })
        }
    }
    public render() {
        const { columns, classes } = this.props
        const { tweetId, assignment, assignerOpen } = this.state

        return (
            <React.Fragment>
                <TweetColumnAssignerContainer
                    open={assignerOpen}
                    assignment={assignment}
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
