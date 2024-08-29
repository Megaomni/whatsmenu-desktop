import { Socket, io } from 'socket.io-client'
import { api } from 'src/lib/axios'

self.onmessage = (event) => {
  const { port } = event.data

  let socket: Socket | null = null
  

  port.onmessage = (message: MessageEvent<any>) => {
    const { event, data } = message.data
    if (event === 'connect') {
      socket = io(data.config.url, {
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        console.log('connected', socket?.id)
        const socketId = socket?.id
        port.postMessage({ event, socketId })
      })

      socket.onAny((event, data) => {
        port.postMessage({ event, data })
      })
    }
    if (event === 'join') {
      if (socket) {
        socket.emit('join', { room: data.room })
      }
    }
  }
}
