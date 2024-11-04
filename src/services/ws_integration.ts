import { DateTime } from "luxon";
import { Server } from "socket.io";

export const io = new Server({
  transports: ["websocket"],
  cors: { origin: "*" },
});
io.on("connection", (socket) => {
  console.log("socket id", socket.id);
  socket.on("join", ({ room }: { room: string }) => {
    socket.join(room);
    console.log({
      date: DateTime.local().toFormat("dd/MM/yyyy HH:mm:ss"),
      connected: room,
    });
  });
});

io.listen(9487);
