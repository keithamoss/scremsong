import Button from '@material-ui/core/Button'
import style from 'jss-material-ui'
import * as React from 'react'

const LoginButton = style(Button)((_theme: any, { colour }: any) => ({
  root: {
    backgroundColor: colour,
    color: '#FFFFFF',
  },
}))

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
      <LoginButton variant="contained" colour={colour} fullWidth={true} onClick={this.handleClick}>
        {providerName}
      </LoginButton>
    )
  }
}
