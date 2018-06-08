import RaisedButton from "material-ui/RaisedButton"
import * as React from "react"

export interface ISocialLoginButtonProps {
    providerName: string
    providerUrl: string
    colour: string
}
export interface ISocialLoginButtonState {}

export class SocialLoginButton extends React.Component<ISocialLoginButtonProps, ISocialLoginButtonState> {
    public handleClick = () => {
        window.location.href = this.props.providerUrl
    }
    public render() {
        const { providerName, colour } = this.props

        return (
            <RaisedButton
                label={providerName}
                style={{
                    margin: 12,
                    display: "block",
                }}
                backgroundColor={colour}
                labelColor={"#ffffff"}
                onClick={this.handleClick}
            />
        )
    }
}
