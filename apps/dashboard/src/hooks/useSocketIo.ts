import EventEmitter from "events";
import { useEffect, useRef, useState } from "react";
type SubscribeChannels = 'request' | 'command' | 'print' | 'profile' | 'ifood'


export let useWsConnected = false;

export const useSocketIo = () => {
  const workerRef = useRef<Worker>()
  const channelRef = useRef(new MessageChannel())
  const [ connection, setConnection ] = useState<any>(null)
  const { port1, port2 } = channelRef.current
  const socket = new EventEmitter()
  const [connect, setConnect] = useState(false)
  
  const socketIoConnect = (config: {url:string}) => {
    if (!useWsConnected) { 

    if (!connection) {
      workerRef.current?.postMessage({ port: port2 }, [port2]);
    }
    const newConnection = (event: 'connect') => port1.postMessage({ event, data: { config } })
    newConnection('connect')
    port1.onmessage = async (message: any) => {
      const { data, event, socketId } = message.data
      if(socketId) {
        setConnect(true)
      }
      socket.emit(event, data)
      switch (event) {
        case 'connected': 
           setConnection(data.connection)
            break;
      
        default:
            break;
      }
    }
    useWsConnected = true;
    
  }}
  const socketIoSubscribe = (channel: SubscribeChannels, slug: string) => {
    const room = `${channel}:${slug}`
    port1.postMessage({ event: 'join', data: { room } })
  }

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/socket-io.worker.ts', import.meta.url))
  }, [])
  
  return {
    socketIoConnect,
    socketIoSubscribe,
    socket,
    connect,
  }
}