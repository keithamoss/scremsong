import ReconnectingWebSocket from 'reconnecting-websocket'
import { Action } from 'redux'
import { connected, disconnected, isDevEnvironment, loaded } from '../redux/modules/app'
import { IActionWebSocketBase } from './actions'
import { messageTypes, WS_CONNECTED, WS_URI } from './constants'

// Web Socket connection and handle dispatching actions for Redux onmessage
const socket = new ReconnectingWebSocket(WS_URI, [], {
  connectionTimeout: 10000,
})

// socket.onopen = (e: any) => {
//     console.log("Socket connection opened", e)
// }

socket.onerror = (e: any) => {
  console.error('Socket received an error unexpectedly', e)
}

export const init = (store: any) => {
  const onWebSocketConnect = (_data: any) => {
    // Initial loading of the user still taken care of by fetchInitialAppState() in app.tsx
    // Blocked moving completely to Web Sockets for initial load by not being able to send a custom close/reject code or message
    // await store.dispatch(loadUser(data.user))
    // if (data.is_logged_in === true) {
    //     store.dispatch(changeCurrentReviewer(data.user.id))
    // }

    store.dispatch(connected())
    store.dispatch(loaded())
  }

  socket.onmessage = (e: MessageEvent) => {
    const data = JSON.parse(e.data)

    if ('msg_type' in data) {
      if (isDevEnvironment() === true) {
        console.log(data.msg_type, data)
      }

      let actions
      if (data.msg_type === WS_CONNECTED && 'actions' in data) {
        // Handle the initial payload of actions from Web Socket onopen
        actions = data.actions
        onWebSocketConnect(data)
      } else {
        // Handle individual actions sent back via Web Sockets
        actions = [data]
      }

      actions.forEach((action: IActionWebSocketBase, _index: number) => {
        if (messageTypes.includes(action.msg_type)) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { msg_type, ...payload } = action
          store.dispatch({ type: msg_type, ...payload })
        } else {
          console.error('Receieve a web socket message with an invalid Message Type.', action)
        }
      })
    } else {
      console.error('Receieve a web socket message without a Message Type.', data)
    }
  }

  socket.onclose = (e: CloseEvent) => {
    if (e.code !== 1000 || e.wasClean === false) {
      console.error('Socket closed unexpectedly', e)
      store.dispatch(disconnected())
    }
  }
}
export const emit = (action: Action) => socket.send(JSON.stringify(action))
