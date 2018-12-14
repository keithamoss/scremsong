import * as React from "react"
import { ITriageColumn } from "src/redux/modules/triage"
import styled from "styled-components"
import TweetColumnContainer from "../TweetColumn/TweetColumnContainer"

const ColumnContainerContainer = styled.div`
    display: inline-block;
    height: 100%;
`

const ColumnContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 88%;
`

export interface IProps {
    columns: ITriageColumn[]
}

export class TriageView extends React.Component<IProps, {}> {
    public render() {
        const { columns } = this.props

        // if (columns.length === 0 || (columns.length === 1 && columns[0] === undefined)) {
        //     console.log("null")
        //     return null
        // }

        return (
            <ColumnContainerContainer>
                <ColumnContainer>
                    {columns.map((column: ITriageColumn, key: number) => (
                        <TweetColumnContainer key={column.id} column={column} />
                    ))}
                </ColumnContainer>
            </ColumnContainerContainer>
        )
    }
}

export default TriageView
