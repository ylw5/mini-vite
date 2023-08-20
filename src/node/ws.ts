import connect from 'connect'
import { OPEN, WebSocketServer } from 'ws'
import { HMR_PORT } from './constants'

export function createWebSocketServer(server: connect.Server): {
  send: (payload: Object) => void
  close: () => void
} {
  const wss = new WebSocketServer({port: HMR_PORT})
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }))
  })

  wss.on('error', (e) => {
    console.log(e)
  })

  return {
    send(payload) {
      const stringified = JSON.stringify(payload)
      wss.clients.forEach(client => {
        if(client.readyState === OPEN) {
          client.send(stringified)
        }
      })
    },
    close() {
      wss.close()
    },
  }

}