import { DateTime } from "luxon";
import { Server } from "socket.io";

export const io = new Server({ transports: ["websocket"], cors: { origin: "*" } });
console.log('opa')
io.on("connection", (socket) => {
  socket.on('join', ({ room }: { room: string }) => {
    socket.join(room)
    console.log({
      date: DateTime.local().toFormat('dd/MM/yyyy HH:mm:ss'),
      connected: room,
    })

    
  })
});

io.listen(3434);