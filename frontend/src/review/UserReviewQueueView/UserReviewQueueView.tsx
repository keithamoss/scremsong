import { Card, CardActions, CardText, Checkbox, MenuItem, RaisedButton, SelectField, Toolbar, ToolbarGroup } from "material-ui"
import { ActionAssignmentTurnedIn, ActionVisibility, ActionVisibilityOff } from "material-ui/svg-icons"
import * as React from "react"
import Tweet from "react-tweet"
import { IReviewerAssignment, IReviewerUser } from "src/redux/modules/reviewers"
import { ISocialTweet } from "src/redux/modules/social"
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
    assignments: IReviewerAssignment[]
    tweets: ISocialTweet[]
    reviewers: IReviewerUser[]
    currentReviewer: IReviewerUser
    onMarkAsDone: any
    onChangeQueueUser: any
    onToggleUserOnlineStatus: any
}

export class UserReviewQueueView extends React.Component<IProps, {}> {
    private onMarkAsDone: Function

    public constructor(props: IProps) {
        super(props)
        this.onMarkAsDone = (assignment: IReviewerAssignment) => () => this.props.onMarkAsDone(assignment)
    }
    public render() {
        const { assignments, tweets, reviewers, currentReviewer, onChangeQueueUser, onToggleUserOnlineStatus } = this.props

        return (
            <React.Fragment>
                <Toolbar>
                    <ToolbarGroup>
                        <SelectField
                            floatingLabelStyle={{ color: "white" }}
                            floatingLabelText="Viewing the queue for"
                            labelStyle={{ color: "white" }}
                            value={currentReviewer.id}
                            onChange={onChangeQueueUser}
                        >
                            {reviewers.map((reviewer: IReviewerUser) => (
                                <MenuItem key={reviewer.id} value={reviewer.id} primaryText={reviewer.name} />
                            ))}
                        </SelectField>
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <Checkbox
                            checked={currentReviewer.is_accepting_assignments}
                            onCheck={onToggleUserOnlineStatus}
                            checkedIcon={<ActionVisibility />}
                            uncheckedIcon={<ActionVisibilityOff />}
                            iconStyle={{ fill: "white" }}
                            label="Toggle Accepting Assignments"
                            labelPosition="left"
                            labelStyle={{ color: "white", width: "140px" }}
                        />
                    </ToolbarGroup>
                </Toolbar>

                <ReviewContainer>
                    {assignments.map((assignment: IReviewerAssignment) => (
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
