'use strict'

/*
|--------------------------------------------------------------------------
| Websocket
|--------------------------------------------------------------------------
|
| This file is used to register websocket channels and start the Ws server.
| Learn more about same in the official documentation.
| https://adonisjs.com/docs/websocket
|
| For middleware, do check `wsKernel.js` file.
|
*/

const Ws = use('Ws')
const moment = use('moment')

Ws.channel('request:*', async ({ socket }) => {
  // console.log('user joined with %s socket id', socket.id)
  console.log({ conected: socket.topic, date: moment().format() })

  socket.on('close', async (e) => {
    console.log({
      close: socket.topic,
      date: moment().format(),
    })
  })

  socket.on('error', async (err) => {
    console.error(err)
  })

  // socket.on('request:barleys', (request) => {
  //   console.log(request)
  //   try {
  //     socket.broadcastToAll('request:barleys', request)
  //   } catch (error) {
  //     console.error(error)
  //   }
  // })
})

Ws.channel('command:*', async ({ socket }) => {
  console.log({ conected: socket.topic, date: moment().format() })
})

Ws.channel('print:*', 'PrintController')
Ws.channel('profile:*', 'ProfileController')

// Ws.channel('request', 'RequestController')
