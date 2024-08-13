'use strict'

const moment = use('moment')

class ProfileController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    console.log({ conected: socket.topic, date: moment().format() })
  }

  onLogout(data) {
    // evento logout
    console.log(data)
  }

  onQueues(data) {
    console.log(data)
  }
}

module.exports = ProfileController
