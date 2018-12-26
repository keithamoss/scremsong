import * as Cookies from "js-cookie"
import * as qs from "qs"
import { beginFetch, finishFetch, getAPIBaseURL } from "../redux/modules/app"

export class APIClient {
    private baseURL: string

    constructor() {
        this.baseURL = getAPIBaseURL()
    }

    public get(
        url: string,
        dispatch: Function | null,
        params: object = {},
        quiet: boolean = false,
        fetchOptions: object = {}
    ): Promise<IApiResponse> {
        if (dispatch !== null && quiet === false) {
            dispatch(beginFetch())
        }

        if (Object.keys(params).length > 0) {
            // Yay, a library just to do query string operations for fetch()
            // https://github.com/github/fetch/issues/256
            url += "?" + qs.stringify(params)
        }

        return fetch(this.baseURL + url, { ...{ credentials: "include" }, ...fetchOptions })
            .then((response: any) => {
                if (dispatch !== null && quiet === false) {
                    dispatch(finishFetch())
                }

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

    public post(url: string, body: any, dispatch: any) {
        dispatch(beginFetch())

        return fetch(this.baseURL + url, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": Cookies.get("csrftoken")!,
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
            method: "PUT",
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": Cookies.get("csrftoken")!,
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
            mode: "cors",
            credentials: "include",
            headers: {
                "X-CSRFToken": Cookies.get("csrftoken")!,
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
