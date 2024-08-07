import { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import BackgroundTimer from 'react-native-background-timer';

export const useWebSocket = (profile: any, callbacks?: { onClose?: () => any, onConnected?: () => void }) => {
  const [socket, setSocket] = useState<WebSocket>()
  const [pongInterval, setPongInterval] = useState<number>()
  const [reconnectInterval, setReconnectInterval] = useState<number>()
  const [status, setStatus] = useState(socket?.readyState ?? 0)

  const connect = () => {
    let url = 'wss://rt2.whatsmenu.com.br/adonis-ws'
    if (profile.next) {
      url = 'wss://rt3.whatsmenu.com.br/adonis-ws'
    }
    const newConnect = new WebSocket(url)
    setSocket(newConnect)
    return newConnect
  }

  const ononpen = (event: any) => {
    if (socket) {
      console.log('%c[ws-connected]:', 'color: #0f0', `on ${event.target.url}`, ` - ${new Date().toTimeString()}`)
      callbacks?.onConnected && callbacks.onConnected()
      const intervalId = BackgroundTimer.setInterval(() => {
        socket.send(JSON.stringify({ t: 8 }))
      }, 10 * 1000)
      setPongInterval(intervalId)
      socket.send(JSON.stringify({
        t: 1,
        d: {
          topic: `print:${profile?.slug}`
        }
      }))
      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        switch (data.t) {
          case 3: {
            console.log('%c[ws-subscribe]:', 'color: #ff0', `initiating subscription for ${data.d.topic} topic with server`, ` - ${new Date().toTimeString()}`)
            break;
          }
          case 7: {
            const data = JSON.parse(event.data)
            if (data.d.event.includes('print')) {
              DeviceEventEmitter.emit('request:print', data.d.data)
            }
            if (data.d.event.includes('directPrint')) {
              DeviceEventEmitter.emit('request:directPrint', data.d.data)
            }
            break;
          }
          case 9: {
            console.log('%c[ws-pong]:', 'color: #f57dd1', `pong packet +25s`)
            break;
          }
        }
      }
      socket.onclose = (event) => {
        console.log('%c[ws-disconnected]:', 'color: #f00', `code ${event.code} ${event.reason}`, ` - ${new Date().toTimeString()}`)
        setSocket(socket);

        BackgroundTimer.clearInterval(pongInterval!);
        if (event.reason !== 'logoff') {
          callbacks?.onClose && callbacks.onClose()
        }
      }
    }
  }

  useEffect(() => {
    if ((socket && !socket.onopen) && profile) {
      socket.onopen = ononpen
    }
  }, [socket, profile])

  useEffect(() => {
    setStatus(state => socket?.readyState ?? 0)
    setTimeout(() => {
      setStatus(state => socket?.readyState ?? 0)
    }, 1000 * 10);
  }, [socket?.readyState])

  useEffect(() => {
    if (!reconnectInterval && socket) {
      let reconnection: WebSocket | null;
      const interval = BackgroundTimer.setInterval(() => {
        if (socket?.readyState === 3 && (!reconnection || reconnection?.readyState === 3)) {
          reconnection = connect() satisfies WebSocket
        }
        console.log('reconnect', reconnection?.readyState);

      }, 3 * 1000)
      setReconnectInterval(interval)
    }
  })

  return {
    socket,
    connect,
    status
  }
}

