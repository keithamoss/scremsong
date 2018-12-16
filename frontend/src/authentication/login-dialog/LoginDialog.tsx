import { Dialog, DialogContent, DialogTitle } from "@material-ui/core"
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
            <Dialog aria-labelledby="simple-dialog-title" open={open} fullWidth={true}>
                <DialogTitle id="simple-dialog-title">Please login to access Scremsong</DialogTitle>
                <DialogContent>
                    <SocialLoginButton providerName="Google" providerUrl={`${getAPIBaseURL()}/login/google-oauth2/`} colour={"#DD4B39"} />
                </DialogContent>
            </Dialog>
        )
    }
}
