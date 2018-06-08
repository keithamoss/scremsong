import * as React from "react"
import Tweet from "react-tweet"
import TwitterLogin from "react-twitter-auth"
import "./App.css"
import logo from "./logo.svg"

class App extends React.Component<any, any> {
    constructor(props: any) {
        super(props)
        this.state = { tweets: [] }
    }

    public componentDidMount() {
        const oReq = new XMLHttpRequest()
        oReq.addEventListener("load", (e: any) => {
            this.setState({ tweets: JSON.parse(oReq.response).statuses })
        })
        oReq.open("GET", "http://localhost:8000/twitter.php")
        oReq.send()
    }

    public onFailed() {
        console.log("onFailed")
    }
    public onSuccess() {
        console.log("onSuccess")
    }

    public render() {
        const { tweets } = this.state
        // use linkProps if you want to pass attributes to all links
        const linkProps = { target: "_blank", rel: "noreferrer" }

        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <p className="App-intro">
                    To get started, edit <code>src/App.tsx</code> and save to reload.
                </p>
                <TwitterLogin
                    loginUrl="http://localhost:3000/api/v1/auth/twitter"
                    onFailure={this.onFailed}
                    onSuccess={this.onSuccess}
                    requestTokenUrl="http://localhost:3000/api/v1/auth/twitter/reverse"
                />
                {tweets.map((tweet: any) => <Tweet key={tweet.id_str} data={tweet} linkProps={linkProps} />)}
            </div>
        )
    }
}

export default App
