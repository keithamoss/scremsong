import { SnackbarProvider } from "notistack"
import * as createRavenMiddleware from "raven-for-redux"
import * as Raven from "raven-js"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { Provider } from "react-redux"
// React Router
import { BrowserRouter } from "react-router-dom"
// Redux & Redux Thunks
import { applyMiddleware, createStore, Store } from "redux"
import { composeWithDevTools } from "redux-devtools-extension"
// import { syncHistoryWithStore } from "react-router-redux"
// import getRoutes from "./routes"
// Redux Responsive
// import { responsiveStoreEnhancer } from "redux-responsive"
import thunkMiddleware from "redux-thunk"
import { APIClient } from "./api/APIClient"
import AppContainer from "./AppContainer"
import "./index.css"
import "./polyfills"
import { eAppEnv, getEnvironment } from "./redux/modules/app"
import { IMyWindow } from "./redux/modules/interfaces"
// Google Analytics
// import { AnalyticsMiddleware, fireAnalyticsTracking } from "./shared/analytics/GoogleAnalytics"
// Sentry.io
// Service Workers
// import registerServiceWorker from "./registerServiceWorker"
// import { getEnvironment, eAppEnv } from "./redux/modules/app"
import reducers, { IStore } from "./redux/modules/reducer"
import { emit, init as websocketInit } from "./websockets/connect"

declare var window: IMyWindow
window.api = new APIClient()

const Middleware: any[] = []

// Sentry.io
if (getEnvironment() === eAppEnv.PROD && "REACT_APP_RAVEN_URL" in process.env) {
    Raven.config(process.env.REACT_APP_RAVEN_URL!, {
        environment: process.env.NODE_ENV,
        // @ts-ignore
        site: process.env.REACT_APP_RAVEN_SITE_NAME!,
    }).install()
    // @ts-ignore
    Middleware.push(createRavenMiddleware(Raven))
}

// Google Analytics
// if ("REACT_APP_GOOGLE_ANALYTICS_UA" in process.env) {
//     Middleware.push(AnalyticsMiddleware as any)
// }

const composeEnhancers = composeWithDevTools({
    // Specify name here, actionsBlacklist, actionsCreators and other options if needed
})
const store: Store<IStore> = createStore(
    reducers,
    composeEnhancers(applyMiddleware(thunkMiddleware.withExtraArgument({ api: window.api, emit }), ...Middleware))
)
websocketInit(store)

// const history = syncHistoryWithStore(browserHistory as any, store)

ReactDOM.render(
    <Provider store={store}>
        {/* For Google Analytics, add the onUpdate prop to <Router> */}
        {/* <Router history={history as any} onUpdate={"REACT_APP_GOOGLE_ANALYTICS_UA" in process.env ? fireAnalyticsTracking : undefined}> */}

        <BrowserRouter>
            <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <AppContainer />
            </SnackbarProvider>
        </BrowserRouter>
    </Provider>,
    document.getElementById("root")
)

// Service Workers
// registerServiceWorker()
