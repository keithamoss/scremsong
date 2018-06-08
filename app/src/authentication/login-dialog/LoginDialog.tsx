import Dialog from "material-ui/Dialog"
import * as React from "react"
import { getAPIBaseURL } from "../../redux/modules/app"
import { SocialLoginButton } from "../social-login-button/SocialLoginButton"

export interface ILoginDialogProps {
    open: boolean
}
export interface ILoginDialogState {}

export class LoginDialog extends React.Component<ILoginDialogProps, ILoginDialogState> {
    public render() {
        const { open } = this.props

        return (
            <Dialog title="Please login to access Scremsongg" modal={true} open={open}>
                <SocialLoginButton providerName="Google" providerUrl={`${getAPIBaseURL()}/login.php`} colour={"#DD4B39"} />
            </Dialog>
        )
    }
}
