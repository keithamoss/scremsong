import { APIClient } from "../../api/APIClient"

export interface IEnvVars {
    NODE_ENV: string // development, test, production
    REACT_APP_ENVIRONMENT: string // DEVELOPMENT, PRODUCTION
    REACT_APP_SITE_BASE_URL: string
    REACT_APP_API_BASE_URL: string
    REACT_APP_WEB_SOCKET_URI: string
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

export interface IThunkExtras {
    api: APIClient
    emit: Function
}

/* Material UI muiThemeable palette object */
// tslint:disable-next-line:no-empty-interface
// export interface IMUIThemePalette extends __MaterialUI.Styles.ThemePalette {}

// export interface IMUITheme {
//     palette: IMUIThemePalette
// }

// export interface IMUIThemeProps {
//     muiTheme: IMUITheme
// }
