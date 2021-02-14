import Button from '@material-ui/core/Button'
import * as React from 'react'

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
      <Button
        variant="contained"
        style={{ color: '#FFFFFF', backgroundColor: colour }}
        fullWidth={true}
        onClick={this.handleClick}
      >
        {providerName}
      </Button>
    )
  }
}
