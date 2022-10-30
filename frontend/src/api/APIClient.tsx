import { Button } from '@material-ui/core'
import Cookies from 'js-cookie'
import * as qs from 'qs'
import * as Raven from 'raven-js'
import * as React from 'react'
import { beginFetch, ENotificationVariant, finishFetch, getAPIBaseURL, sendNotification } from '../redux/modules/app'
import { IAPIClient, IApiResponse } from '../redux/modules/interfaces'

export class APIClient implements IAPIClient {
  private baseURL: string

  constructor() {
    this.baseURL = getAPIBaseURL()
  }

  public get(
    baseURL: string,
    dispatch: Function | null,
    params: object = {},
    quiet = false,
    fetchOptions: object = {}
  ): Promise<IApiResponse> {
    if (dispatch !== null && quiet === false) {
      dispatch(beginFetch())
    }

    let url = baseURL
    if (Object.keys(params).length > 0) {
      // Yay, a library just to do query string operations for fetch()
      // https://github.com/github/fetch/issues/256
      url += `?${qs.stringify(params)}`
    }

    return fetch(this.baseURL + url, { ...{ credentials: 'include' }, ...fetchOptions })
      .then((response: any) => {
        if (dispatch !== null && quiet === false) {
          dispatch(finishFetch())
        }

        return response
          .json()
          .then((json: any) => {
            if (json.error) {
              this.handleError(json.error, baseURL, dispatch)
            }

            return {
              response,
              json,
            }
          })
          .catch((_error: any) => this.handleError(`Unknown error from ${baseURL}`, baseURL, dispatch))
      })
      .catch((error: any) => this.handleError(error, baseURL, dispatch))
  }

  public post(url: string, body: any, dispatch: any) {
    dispatch(beginFetch())

    return fetch(this.baseURL + url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken')!,
      },
      body: JSON.stringify(body),
    })
      .then((response: any) => {
        dispatch(finishFetch())
        return response.json().then((json: any) => ({
          response,
          json,
        }))
      })
      .catch((error: any) => this.handleError(error, url, dispatch))
  }

  public put(url: string, body: object, dispatch: any) {
    dispatch(beginFetch())

    return fetch(this.baseURL + url, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken')!,
      },
      body: JSON.stringify(body),
    })
      .then((response: any) => {
        dispatch(finishFetch())
        return response.json().then((json: any) => ({
          response,
          json,
        }))
      })
      .catch((error: any) => this.handleError(error, url, dispatch))
  }

  public delete(url: string, dispatch: any) {
    dispatch(beginFetch())

    return fetch(this.baseURL + url, {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken')!,
      },
    })
      .then((response: any) => {
        dispatch(finishFetch())
        return response
      })
      .catch((error: any) => this.handleError(error, url, dispatch))
  }

  // Handles fatal errors from the API (i.e. non-200 responses)
  // eslint-disable-next-line class-methods-use-this
  private handleError(error: string, _url: string, dispatch: any) {
    Raven.captureException(error)
    Raven.showReportDialog({})

    dispatch(
      sendNotification({
        message: error,
        options: {
          variant: ENotificationVariant.ERROR,
          autoHideDuration: 6000,
          action: (
            <React.Fragment>
              <Button size="small" color="inherit">
                OK
              </Button>
            </React.Fragment>
          ),
        },
      })
    )
  }
}
