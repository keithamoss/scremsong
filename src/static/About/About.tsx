import * as React from "react"
import { connect } from "react-redux"
import styled from "styled-components"
import { IStore } from "../../redux/modules/interfaces"

export interface IProps {}

export interface IDispatchProps {}

export interface IStoreProps {}

export interface IStateProps {}

interface IRouteProps {}

interface IOwnProps {
    params: IRouteProps
}

const PageWrapper = styled.div`
    padding-left: 15px;
    padding-right: 15px;
`

export class AboutPage extends React.Component<IProps & IStoreProps & IDispatchProps, IStateProps> {
    render() {
        return <PageWrapper>Lorem ipsum dolor sit amet...</PageWrapper>
    }
}

const mapStateToProps = (state: IStore, ownProps: IOwnProps): IStoreProps => {
    // const { elections } = state

    return {}
}

const mapDispatchToProps = (dispatch: Function): IDispatchProps => {
    return {}
}

const AboutPageWrapped = connect(
    mapStateToProps,
    mapDispatchToProps
)(AboutPage)

export default AboutPageWrapped
