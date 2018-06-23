import Dialog from "material-ui/Dialog"
import * as React from "react"
import { getAPIBaseURL } from "src/redux/modules/app"
import { SocialLoginButton } from "../social-login-button/SocialLoginButton"

export interface ILoginDialogProps {
    open: boolean
}
export interface ILoginDialogState {}

export class LoginDialog extends React.Component<ILoginDialogProps, ILoginDialogState> {
    public render() {
        const { open } = this.props

        return (
            <Dialog title="Please login to access Scremsong" modal={true} open={open}>
                <SocialLoginButton providerName="Google" providerUrl={`${getAPIBaseURL()}/login/google-oauth2/`} colour={"#DD4B39"} />
            </Dialog>
        )
    }
}
