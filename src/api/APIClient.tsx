import * as qs from "qs"
import "whatwg-fetch"
import { beginFetch, finishFetch, getAPIBaseURL } from "../redux/modules/app"

// Uncomment if required for CORS X-CSRFToken
// import cookie from "react-cookie"

export class APIClient {
    private baseURL: string

    constructor() {
        this.baseURL = getAPIBaseURL()
    }

    public get(url: string, dispatch: Function, params: object = {}, fetchOptions: object = {}): Promise<IApiResponse> {
        dispatch(beginFetch())

        if (Object.keys(params).length > 0) {
            // Yay, a library just to do query string operations for fetch()
            // https://github.com/github/fetch/issues/256
            url += "?" + qs.stringify(params)
        }

        return fetch(this.baseURL + url, { ...{ credentials: "include" }, ...fetchOptions })
            .then((response: any) => {
                dispatch(finishFetch())
                return response.json().then((json: any) => {
                    if (json.error) {
                        this.handleError(json.messages, url, dispatch)
                    }

                    return {
                        response,
                        json,
                    }
                })
            })
            .catch((error: any) => this.handleError(error, url, dispatch))
    }

    public post(url: string, params: object, body: any, dispatch: any) {
        dispatch(beginFetch())

        if (Object.keys(params).length > 0) {
            // Yay, a library just to do query string operations for fetch()
            // https://github.com/github/fetch/issues/256
            url += "?" + qs.stringify(params)
        }

        return fetch(this.baseURL + url, {
            method: "POST",
            credentials: "include",
            headers: {
                // "Content-Type": "application/json",
                // "X-CSRFToken": cookie.load("csrftoken"),
            },
            body,
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
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                // "X-CSRFToken": cookie.load("csrftoken"),
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
            method: "DELETE",
            credentials: "include",
            headers: {
                // "X-CSRFToken": cookie.load("csrftoken"),
            },
        })
            .then((response: any) => {
                dispatch(finishFetch())
                return response
            })
            .catch((error: any) => this.handleError(error, url, dispatch))
    }

    // Only handles fatal errors from the API (i.e. non-200 responses)
    private handleError(error: any[], url: string, dispatch: any) {
        // dispatch(
        //     // Do whatever you want to do here to alert the user to a problem
        // )
    }
}

// Models
export interface IAPIClient {
    handleError: Function
    get: Function
    post: Function
    put: Function
    delete: Function
}

export interface IApiResponse {
    response: Response
    json: any
}
