import * as React from "react"
import { connect } from "react-redux"
import styled from "styled-components"
import { IStore } from "../../redux/modules/interfaces"

// tslint:disable-next-line:no-empty-interface
export interface IProps {}

// tslint:disable-next-line:no-empty-interface
export interface IDispatchProps {}

// tslint:disable-next-line:no-empty-interface
export interface IStoreProps {}

// tslint:disable-next-line:no-empty-interface
export interface IStateProps {}

// tslint:disable-next-line:no-empty-interface
interface IRouteProps {}

interface IOwnProps {
    params: IRouteProps
}

const PageWrapper = styled.div`
    padding-left: 15px;
    padding-right: 15px;
`

export class AboutPage extends React.Component<IProps & IStoreProps & IDispatchProps, IStateProps> {
    public render() {
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

const AboutPageWrapped = connect<IStoreProps, IDispatchProps, IProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(AboutPage)

export default AboutPageWrapped
