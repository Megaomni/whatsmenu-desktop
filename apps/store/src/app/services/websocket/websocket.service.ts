import { Injectable } from '@angular/core'
import { Observable, Subscriber } from 'rxjs'
import { CommandType } from 'src/app/command-type'
import { RequestType } from 'src/app/request-type'
import { environment } from 'src/environments/environment'

type SubscribeChannels = 'request' | 'command' | 'print' | 'profile'

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private url: string = environment.apiWS
  private pongInterval: any
  private noReconnect = false
  connection: WebSocket
  attempts = 0
  constructor() {}

  private initConnection(observer: Subscriber<unknown>) {
    this.noReconnect = false
    this.connection = new WebSocket(this.url)
    console.log('%c[ws-connecting]:', 'color: #00ffaf', `creating socket connection on ${this.url}`, ` - ${new Date().toTimeString()}`)

    this.connection.onopen = () => {
      console.log('%c[ws-connected]:', 'color: #0f0', `on ${this.url}`, ` - ${new Date().toTimeString()}`)
      observer.next({ type: 'connection', data: { connection: this.connection } })
      this.pongInterval = setInterval(() => {
        this.connection.send(JSON.stringify({ t: 8 }))
      }, 1000 * 25)
    }

    this.connection.onclose = (event) => {
      if (this.connection) {
        console.log('%c[ws-disconnected]:', 'color: #f00', `code ${event.code} ${event.reason}`, ` - ${new Date().toTimeString()}`)
        clearInterval(this.pongInterval)
        if (!this.noReconnect) {
          this.attempts++
          this.initConnection(observer)
          console.log(
            '%c[ws-reconnecting]:',
            'color: #aaffaf',
            `tentaive ${this.attempts} socket reconnection on ${this.url}`,
            ` - ${new Date().toTimeString()}`
          )
        }
      }
    }

    this.connection.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.t) {
        case 3: {
          console.log(
            '%c[ws-subscribe]:',
            'color: #ff0',
            `initiating subscription for ${data.d.topic} topic with server`,
            ` - ${new Date().toTimeString()}`
          )
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
                observer.next({ type: 'request', data: { request } })
                console.log(
                  `%c[ws-request-${request.type}]:`,
                  `color: ${colors[request.type]}`,
                  `code ${request.code}`,
                  `${request.tentatives > 0 ? request.tentatives + ' tentaiva reenvio' : ''}`,
                  ` - ${new Date().toTimeString()}`
                )
              })
          }
          if (data.d.event.includes('command')) {
            const commands: CommandType[] = data.d.data.commandsWs
            commands.forEach((command) => {
              observer.next({
                type: 'command',
                data: { command, finish: data.d.data.finish, tableId: command.tableId ?? data.d.data.tableId, tableStatus: data.d.data.tableStatus },
              })
            })
            if (Object.keys(data.d.data).includes('tableStatus')) {
              observer.next({ type: 'command', data: { tableId: data.d.data.tableId, tableStatus: data.d.data.tableStatus } })
            }
          }
          if (data.d.event.includes('profile')) {
            observer.next({ type: 'profile', data: data.d.data })
          }
          break
        }
        case 9: {
          console.log('%c[ws-pong]:', 'color: #f57dd1', `pong packet +25s`)
          break
        }
      }
    }
  }

  public connect = new Observable((observer) => {
    this.initConnection(observer)
  })

  public disconnect() {
    this.noReconnect = true
    this.connection.close(1000, 'Terminated by user')
  }

  public emit(event: 'directPrint', topic: `${SubscribeChannels}:${string}`, data: any) {
    this.connection.send(
      JSON.stringify({
        t: 7,
        d: {
          event,
          data,
          topic,
        },
      })
    )
  }

  public subscribe(channel: SubscribeChannels, slug: string) {
    const topic = `${channel}:${slug}`
    this.connection.send(
      JSON.stringify({
        t: 1,
        d: {
          topic,
        },
      })
    )
  }
}
