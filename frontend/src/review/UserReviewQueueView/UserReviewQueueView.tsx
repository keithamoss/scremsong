import * as React from "react"
import styled from "../../../node_modules/styled-components"

const ColumnContainerContainer = styled.div`
    display: inline-block;
    height: 100%;
`

export interface IProps {
    // columns: any[]
}

export class UserReviewQueueView extends React.Component<IProps, {}> {
    public render() {
        // const { columns } = this.props

        return <ColumnContainerContainer>My Queue</ColumnContainerContainer>
    }
}

export default UserReviewQueueView
