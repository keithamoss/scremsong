export interface IEnvVars {
  NODE_ENV: string // development, test, production
  REACT_APP_ENVIRONMENT: string // DEVELOPMENT, PRODUCTION
  REACT_APP_SITE_BASE_URL: string
  REACT_APP_API_BASE_URL: string
  REACT_APP_WEB_SOCKET_URI: string
  // REACT_APP_GOOGLE_ANALYTICS_UA: string
  // REACT_APP_MAPBOX_API_KEY: string
  REACT_APP_RAVEN_URL: string
  REACT_APP_RAVEN_SITE_NAME: string
}

// tslint:disable-next-line:no-empty-interface
export interface IConfig {
  // GOOGLE_ANALYTICS_UA: string
  // MAPBOX_API_KEY: string
  // RAVEN_URL: string
}

export interface IAPIClient {
  get(
    url: string,
    dispatch: Function | null,
    params?: object,
    quiet?: boolean,
    fetchOptions?: object
  ): Promise<IApiResponse>
  post(url: string, body: any, dispatch: any): Promise<any>
  put(url: string, body: object, dispatch: any): Promise<any>
  delete(url: string, dispatch: any): Promise<any>
}

export interface IApiResponse {
  response: Response
  json: object
}

export interface IThunkExtras {
  api: IAPIClient
  emit: Function
}

export interface IMyWindow extends Window {
  api: IAPIClient
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
