import { Card, CardActions, CardText, MenuItem, RaisedButton, SelectField, Toolbar, ToolbarGroup } from "material-ui"
import { ActionAssignmentTurnedIn } from "material-ui/svg-icons"
import * as React from "react"
import Tweet from "react-tweet"
import styled from "styled-components"

const ReviewContainer = styled.div`
    display: inline-block;
    /* height: 100%; */
    padding: 10px;
`

const PaddedCard = styled(Card)`
    margin-bottom: 15px;
`

export interface IProps {
    assignments: object[]
    tweets: any[]
    reviewers: any[]
    currentReviewerId: number | null
    onMarkAsDone: any
    onChangeQueueUser: any
}

export class UserReviewQueueView extends React.Component<IProps, {}> {
    private onMarkAsDone: Function

    public constructor(props: any) {
        super(props)
        this.onMarkAsDone = (assignment: any) => () => this.props.onMarkAsDone(assignment)
    }
    public render() {
        const { assignments, tweets, reviewers, currentReviewerId, onChangeQueueUser } = this.props

        return (
            <React.Fragment>
                <Toolbar>
                    <ToolbarGroup>
                        <SelectField
                            floatingLabelStyle={{ color: "white" }}
                            floatingLabelText="Viewing the queue for"
                            labelStyle={{ color: "white" }}
                            value={currentReviewerId}
                            onChange={onChangeQueueUser}
                        >
                            {reviewers.map((reviewer: any) => (
                                <MenuItem key={reviewer.id} value={reviewer.id} primaryText={reviewer.name} />
                            ))}
                        </SelectField>
                    </ToolbarGroup>
                </Toolbar>

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
            </React.Fragment>
        )
    }
}

export default UserReviewQueueView
