import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";

type Protocol = "ws://" | "wss://";
export type wsURL = `${Protocol}${string}`;
export class Ws {
  connection: Socket;

  constructor({
    url,
    options,
  }: {
    url: wsURL;
    options?: Partial<ManagerOptions & SocketOptions>;
  }) {
    this.connection = io(url, {
      transports: ["websocket"],
      ...options,
    });
  }

  public join(room: string) {
    this.connection.emit("join", { room });
  }
}

// eslint-disable-next-line prefer-const
export let websocket: Ws | null = null;
