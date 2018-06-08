export { APIClient, IHttpResponse } from "../../api/APIClient"
export { eAppEnv, IModule as IAppModule } from "./app"
export { IStore } from "./reducer"

export interface IEnvVars {
    NODE_ENV: string // development, test, production
    // REACT_APP_GOOGLE_ANALYTICS_UA: string
    // REACT_APP_MAPBOX_API_KEY: string
    // REACT_APP_RAVEN_URL: string
}

// tslint:disable-next-line:no-empty-interface
export interface IConfig {
    // GOOGLE_ANALYTICS_UA: string
    // MAPBOX_API_KEY: string
    // RAVEN_URL: string
}

/* Material UI muiThemeable palette object */
// tslint:disable-next-line:no-empty-interface
export interface IMUIThemePalette extends __MaterialUI.Styles.ThemePalette {}

export interface IMUITheme {
    palette: IMUIThemePalette
}

export interface IMUIThemeProps {
    muiTheme: IMUITheme
}
