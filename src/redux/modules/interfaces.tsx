export { IStore } from "./reducer"
export { APIClient, IHttpResponse } from "../../api/APIClient"
export { IModule as IAppModule, eAppEnv } from "./app"

export interface IEnvVars {
  NODE_ENV: string // development, test, production
  // REACT_APP_GOOGLE_ANALYTICS_UA: string
  // REACT_APP_MAPBOX_API_KEY: string
  // REACT_APP_RAVEN_URL: string
}

export interface IConfig {
  // GOOGLE_ANALYTICS_UA: string
  // MAPBOX_API_KEY: string
  // RAVEN_URL: string
}

/* Material UI muiThemeable palette object */
export interface IMUIThemePalette extends __MaterialUI.Styles.ThemePalette { }

export interface IMUITheme {
  palette: IMUIThemePalette
}

export interface IMUIThemeProps {
  muiTheme: IMUITheme
}
