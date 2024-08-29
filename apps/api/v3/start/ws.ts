import app from '@adonisjs/core/services/app'
import Ws from '#services/websocket_service'
import { DateTime } from 'luxon'
app.ready(() => {
  Ws.boot()
  const io = Ws.io
  io?.on('connection', (socket) => {
    socket.on('join', ({ room }: { room: string }) => {
      socket.join(room)
      console.log({
        date: DateTime.local().toFormat('dd/MM/yyyy HH:mm:ss'),
        connected: room,
      })
    })
  })
})
