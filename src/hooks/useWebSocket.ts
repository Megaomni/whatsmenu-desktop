import { useEffect, useRef, useState } from "react"
import { EventEmitter } from 'events'
type SubscribeChannels = 'request' | 'command' | 'print' | 'profile'

interface WsEventMessage {
  event: 'subscribe' | 'request' | 'command' | 'profile' | 'connected' | 'closed' | 'reconnect' | 'sucessesFullPrinting'
  data: any
}
 
interface WsEventMessageSubscribe extends WsEventMessage {
  data: {
    topic: `${SubscribeChannels}:${string}`
    type: SubscribeChannels
  }
}

export class Subscription extends EventEmitter {
  constructor(
    public topic: `${SubscribeChannels}:${string}`,
    private port?: MessagePort
  ) {
    super()
    this.topic = topic
  }

  public wsEmit = (event: string, dataToSend: any) => {
    if (this.port) {
      this.port.postMessage({ event: 'emit', data: { topic: this.topic, event, dataToSend } })
    }
  }
}

export let useWsConnected = false;

export const useWebSocket = () => {
  const workerRef = useRef<Worker>()
  const channelRef = useRef(new MessageChannel())
  const [connection, setConnection] = useState<any>(null)
  const subscriptions = useRef<Subscription[]>([])
  const isReconnection = useRef(false)
  const { port1, port2 } = channelRef.current

  const wsConnect = (config: { url: string, reconnectAttempts: number, attemptsInterval: number }, onConnected: (connection: any) => void, onReconnect?: () => void) => {
    if (!useWsConnected) { 
      if (!connection) {
        workerRef.current?.postMessage({ port: port2 }, [port2]);
      }
      const newConnection = (event: 'connect' | 'reconnect' = 'connect') => port1.postMessage({ event, data: config })
      newConnection()
      port1.onmessage = (message: MessageEvent<WsEventMessage>) => {
        const { data, event } = message.data
        switch (event) {
          case 'connected': {
            setConnection(data.connection)
            onConnected(data.connection)
            if (onReconnect && isReconnection.current) {
              onReconnect()
            }
            break;
          }
          case 'closed': {
            subscriptions.current = []
            setConnection(data.connection)
            break
          }
          case 'reconnect': {
            isReconnection.current = true
            if (data.attempts < config.reconnectAttempts) {
              setTimeout(() => {
                newConnection('reconnect')
              }, config.attemptsInterval);
            } else {
              console.error('Não foi possíve reconectar ao servidor ws, máximo de tentativas atigindo')
            }
            break;
          }
          case 'request': {
            const requestChannel = subscriptions.current.find(subscription => subscription.topic === data.topic)
            if (requestChannel) {
              requestChannel.emit('request', data.request)
            }
            break;
          }
          case 'command': {
            const commandChannel = subscriptions.current.find(subscription => subscription.topic === data.topic)
            if (commandChannel) {
              commandChannel.emit('command', data.command)
            }
            break;
          }
          case 'profile': {
            const profileChannel = subscriptions.current.find(subscription => subscription.topic === data.topic)
            if (profileChannel) {
              profileChannel.emit('profile', data)
            }
            break;
          }
          case 'sucessesFullPrinting': {
            const printChannel = subscriptions.current.find(subscription => subscription.topic === data.topic)
            if (printChannel) {
              printChannel.emit('sucessesFullPrinting', data.data)
            }
            break;
          }
        }
      }
      useWsConnected = true;
    }
  }

  const wsSubscribe = (channel: SubscribeChannels, slug: string, onSubscribed: (subscription: Subscription) => void) => {
    const topic = `${channel}:${slug}`
    const alreadySubscribed = subscriptions.current.some(sub => sub.topic === topic)
    if (!alreadySubscribed) {
      port1.postMessage({ event: 'subscribe', data: { topic } })
      port1.addEventListener('message', (message: MessageEvent<WsEventMessageSubscribe>) => {
        if (message.data.event === 'subscribe') {
          const { data } = message.data
          if (subscriptions.current.every(sub => sub.topic !== data.topic) && topic === data.topic) {
            const subscription = new Subscription(data.topic, port1)
            subscriptions.current.push(subscription)
            onSubscribed(subscription)
          }
        }
      })
    }
  }

  const wsClose = () => {
    port1.postMessage({ event: 'close', data: { noReconnect: true } })
    subscriptions.current = []
  }

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/ws.worker.ts', import.meta.url))
  }, [])

  return {
    wsConnect,
    wsSubscribe,
    wsClose,
  }
}