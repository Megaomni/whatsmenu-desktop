'use strict'

const moment = use('moment')
const Cart = use('App/Models/Cart')

class PrintController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    console.log({ conected: socket.topic, date: moment().format() })
  }

  onPrint(data) {
    const firstRequest = data.requests[0]
    if (!data.type) {
      data.type = firstRequest.type
    }
    this.socket.broadcast(this.socket.topic, data)
    this.socket.broadcast('print', data)
    // same as: socket.on('message')
  }

  onDirectPrint(data) {
    this.socket.broadcast('directPrint', data)
  }

  onResume(data) {
    this.socket.broadcast(`resume:${data.slug}`, data)
  }

  async onSucessesFullPrinting(data) {
    const cart = await Cart.find(data.requestId)
    if (cart) {
      cart.print = true
      await cart.save()
    }
    this.socket.broadcast('sucessesFullPrinting', data)
  }
}

module.exports = PrintController
