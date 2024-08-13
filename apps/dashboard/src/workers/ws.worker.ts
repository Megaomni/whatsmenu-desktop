import { CommandType } from '../types/command'
import { RequestType } from '../types/request'

interface IWebSocketEventData {
  event: 'connect' | 'close' | 'reconnect' | 'subscribe' | 'emit'
  data: any
}

self.onmessage = (event) => {
  const { port } = event.data
  let ws: WebSocket | null = null
  let pongInterval: NodeJS.Timer
  let connection: any = null
  let noReconnect = false
  let attempts = 0
  port.onmessage = (message: MessageEvent<IWebSocketEventData>) => {
    const { data, event } = message.data
    if (event === 'connect' || event === 'reconnect') {
      ws = new WebSocket(data.url)
      if (event === 'connect') {
        console.log(
          '%c[ws-connecting]:',
          'color: #00ffaf',
          `creating socket connection on ${data.url}`,
          ` - ${new Date().toTimeString()}`
        )
      }
      if (ws) {
        ws.onopen = (event: any) => {
          console.log(
            '%c[ws-connected]:',
            'color: #0f0',
            `on ${event.target.url}`,
            ` - ${new Date().toTimeString()}`
          )

          connection = {
            url: ws?.url,
            protocol: ws?.protocol,
            readyState: ws?.readyState,
            extensions: ws?.extensions,
            binaryType: ws?.binaryType,
            bufferedAmount: ws?.bufferedAmount,
          }
          port.postMessage({ event: 'connected', data: { connection } })
          pongInterval = setInterval(() => {
            ws?.send(JSON.stringify({ t: 8 }))
          }, 1000 * 25)
        }
      }
      ws.onclose = (event) => {
        if (connection) {
          console.log(
            '%c[ws-disconnected]:',
            'color: #f00',
            `code ${event.code} ${event.reason}`,
            ` - ${new Date().toTimeString()}`
          )
          connection.readyState = ws?.readyState
          port.postMessage({ event: 'closed', data: { connection } })
          clearInterval(pongInterval)
          if (!noReconnect) {
            attempts++
            port.postMessage({
              event: 'reconnect',
              data: { connection, attempts },
            })
            console.log(
              '%c[ws-reconnecting]:',
              'color: #aaffaf',
              `tentaive ${attempts} socket reconnection on ${data.url}`,
              ` - ${new Date().toTimeString()}`
            )
          }
        }
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.t) {
          case 3: {
            console.log(
              '%c[ws-subscribe]:',
              'color: #ff0',
              `initiating subscription for ${data.d.topic} topic with server`,
              ` - ${new Date().toTimeString()}`
            )
            port.postMessage({
              event: 'subscribe',
              data: { topic: data.d.topic },
            })
            break
          }
          case 7: {
            const data = JSON.parse(event.data)
            if (data.d.event.includes('request')) {
              const requests: RequestType[] = data.d.data
              const colors = {
                D: '#2185D0',
                T: '#A5673F',
                P: '#F57151',
              }
              requests
                .sort((a, b) => {
                  if (a.code > b.code) {
                    return 1
                  } else {
                    return -1
                  }
                })
                .forEach((request) => {
                  console.log(
                    `%c[ws-request-${request.type}]:`,
                    `color: ${colors[request.type]}`,
                    `code ${request.code}`,
                    `${request.tentatives > 0 ? request.tentatives + ' tentaiva reenvio' : ''}`,
                    ` - ${new Date().toTimeString()}`
                  )
                  port.postMessage({
                    event: 'request',
                    data: { request, topic: data.d.topic },
                  })
                })
            }
            if (data.d.event.includes('command')) {
              const commands: CommandType[] = data.d.data.commandsWs
              commands.forEach((command) => {
                port.postMessage({
                  event: 'command',
                  data: { command, topic: data.d.topic },
                })
              })
            }
            if (data.d.event.includes('sucessesFullPrinting')) {
              port.postMessage({ event: 'sucessesFullPrinting', data: data.d })
            }
            if (data.d.event.includes('forceLogout')) {
              port.postMessage({ event: 'profile', data: data.d })
            }
            break
          }
          case 9: {
            console.log('%c[ws-pong]:', 'color: #f57dd1', `pong packet +25s`)
            break
          }
        }
      }
    } else if (ws) {
      switch (event) {
        case 'subscribe': {
          const { topic } = data
          ws.send(
            JSON.stringify({
              t: 1,
              d: {
                topic,
              },
            })
          )

          break
        }
        case 'emit': {
          const { event, dataToSend, topic } = data
          ws.send(
            JSON.stringify({
              t: 7,
              d: {
                event,
                data: dataToSend,
                topic,
              },
            })
          )
          break
        }
        case 'close': {
          ws.close(1000, 'Encerrado pelo cliente.')
          noReconnect = data.noReconnect ?? false
          break
        }
      }
    }
  }
}
