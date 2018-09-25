import { Card, CardActions, CardText, RaisedButton } from "material-ui"
import { ActionAssignmentTurnedIn } from "material-ui/svg-icons"
import * as React from "react"
import Tweet from "react-tweet"
import styled from "../../../node_modules/styled-components"

const ReviewContainer = styled.div`
    display: inline-block;
    /* height: 100%; */
    padding: 10px;
`

const PaddedCard = styled(Card)`
    margin-bottom: 15px;
`

export interface IProps {
    user: any
    assignments: object[]
    tweets: any[]
    onMarkAsDone: any
}

export class UserReviewQueueView extends React.Component<IProps, {}> {
    private onMarkAsDone: Function

    public constructor(props: any) {
        super(props)
        this.onMarkAsDone = (assignment: any) => () => this.props.onMarkAsDone(assignment)
    }
    public render() {
        const { assignments, tweets } = this.props

        return (
            <ReviewContainer>
                {assignments.map((assignment: any) => (
                    <React.Fragment key={assignment.id}>
                        <PaddedCard>
                            <CardText>
                                <Tweet data={tweets[assignment.social_id].data} />
                            </CardText>
                            <CardActions>
                                <RaisedButton
                                    label={"Mark as done"}
                                    primary={true}
                                    icon={<ActionAssignmentTurnedIn />}
                                    onClick={this.onMarkAsDone(assignment)}
                                />
                            </CardActions>
                        </PaddedCard>
                    </React.Fragment>
                ))}
            </ReviewContainer>
        )
    }
}

export default UserReviewQueueView
