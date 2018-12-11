import { includes as arrayIncludes } from "core-js/library/fn/array"
import { messageTypes, uri } from "./constants"

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

// export const init = (store: any) => {
//     Object.keys(messageTypes).forEach(type => socket.on(type, (payload: any) => store.dispatch({ type, payload })))
// }
// export const init = (store: any) => {
//     socket.onmessage = (e: any) => {
//         const data = JSON.parse(e.data)
//         const type0 = data.type
//         // const payload = data.message
//         console.log("onmessage", type0, data)

//         // @ts-ignore
//         // if ("fromWSClientId" in data && "_wsClientId" in window && data.fromWSClientId === window._wsClientId) {
//         //     console.log("Filtering message because it's from the user")
//         //     return
//         // }

//         // let type2
//         // if (type0 === "user_assignment_status_change") {
//         //     type2 = "ealgis/app/SET_IS_USER_ACCEPTING_ASSIGNMENTS"
//         // } else if (type0 === "connected") {
//         //     console.log("> setWSClientId", data.channel_name)
//         //     store.dispatch(setWSClientId(data.channel_name))
//         // }
//         // // Object.keys(messageTypes).forEach(type => socket.on(type, (payload: any) => store.dispatch({ type, payload })))
//         // if (type2 !== undefined) {
//         //     const { type, ...rest } = data
//         //     console.log("dispatch", type, rest)
//         //     store.dispatch({ type, ...rest })
//         // }

//         if (type0 === "connected") {
//             console.log("> setWSClientId", data.channel_name)
//             store.dispatch(setWSClientId(data.channel_name))
//         } else {
//             data.type = data.action_type
//             // const { action_type, type, ...rest } = data
//             // console.log("dispatch", action_type, rest)
//             store.dispatch(data)
//         }
//     }
// }

// export const emit = (type: any, payload: any) => socket.emit(type, payload)
// export const emit = (type: any, payload: any) => socket.send(JSON.stringify({ type, payload }))
export const emit = (action: any) => socket.send(JSON.stringify(action))
