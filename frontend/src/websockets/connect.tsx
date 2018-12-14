import { includes as arrayIncludes } from "core-js/library/fn/array"
import ReconnectingWebSocket from "reconnecting-websocket"
import { Action } from "redux"
import { loaded } from "src/redux/modules/app"
import { IActionWebSocketBase } from "./actions"
import { messageTypes, WS_CONNECTED, WS_URI } from "./constants"

// Web Socket connection and handle dispatching actions for Redux onmessage
const socket = new ReconnectingWebSocket(WS_URI)

// socket.onopen = (e: any) => {
//     console.log("Socket connection opened", e)
// }

socket.onclose = (e: CloseEvent) => {
    if (e.code !== 1000 || e.wasClean === false) {
        console.error("Socket closed unexpectedly", e)
    }
}

socket.onerror = (e: any) => {
    console.error("Socket received an error unexpectedly", e)
}

export const init = (store: any) => {
    const onWebSocketConnect = (data: any) => {
        // Initial loading of the user still taken care of by fetchInitialAppState() in app.tsx
        // Blocked moving completely to Web Sockets for initial load by not being able to send a custom close/reject code or message
        // await store.dispatch(loadUser(data.user))
        // if (data.is_logged_in === true) {
        //     store.dispatch(changeCurrentReviewer(data.user))
        // }

        store.dispatch(loaded())
    }

    socket.onmessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data)

        if ("msg_type" in data) {
            console.log(data.msg_type, data)
            let actions
            if (data.msg_type === WS_CONNECTED && "actions" in data) {
                // Handle the initial payload of actions from Web Socket onopen
                actions = data.actions
                onWebSocketConnect(data)
            } else {
                // Handle individual actions sent back via Web Sockets
                actions = [data]
            }

            actions.forEach((action: IActionWebSocketBase, index: number) => {
                if (arrayIncludes(messageTypes, action.msg_type)) {
                    const { msg_type, ...payload } = action
                    store.dispatch({ type: msg_type, ...payload })
                } else {
                    console.error("Receieve a web socket message with an invalid Message Type.", action)
                }
            })
        } else {
            console.error("Receieve a web socket message without a Message Type.", data)
        }
    }
}
export const emit = (action: Action) => socket.send(JSON.stringify(action))
