import { includes as arrayIncludes } from "core-js/library/fn/array"
import { messageTypes, uri } from "./constants"

// Web Socket connection and handle dispatching actions for Redux onmessage
const socket = new WebSocket(uri)

socket.onopen = (e: any) => {
    console.log("Socket connection opened", e)
}

socket.onclose = (e: any) => {
    console.error("Socket closed unexpectedly", e)
}

socket.onerror = (e: any) => {
    console.error("Socket received an error unexpectedly", e)
}

export const init = (store: any) => {
    socket.onmessage = (e: any) => {
        const data = JSON.parse(e.data)

        if ("msg_type" in data && arrayIncludes(messageTypes, data.msg_type)) {
            const { msg_type, type, ...payload } = data
            store.dispatch({ type: data.msg_type, ...payload })
        } else {
            console.error("Receieve a web socket message with an invalid Message Type.", data)
        }
    }
}
export const emit = (action: any) => socket.send(JSON.stringify(action))

// Models
export interface IActionWebSocketBase {
    msg_type: string
}

export interface IActionReviewerSetStatus extends IActionWebSocketBase {
    userId: number
    isAcceptingAssignments: boolean
}
