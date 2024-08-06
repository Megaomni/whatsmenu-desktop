'use strict'
const User = use('App/Models/User')
const Drive = use('Drive')
const Helpers = use('Helpers')

class QueueController {
  static async setClientSupport(clientId) {
    const User = use('App/Models/User')
    const Drive = use('Drive')
    const Helpers = use('Helpers')
    const axios = require('axios')
    const Env = use('Env')

    try {
      console.log('Starting: ', { controller: 'QueueController', linha: 13, metodo: 'setClientSupport' })

      const supportId = await QueueController.pullSupportList()

      const user = await User.find(clientId)

      if (!user.supportId) {
        user.supportId = supportId

        await user.save()
      }

      return (await User.query().where('id', user.id).with('profile').with('seller').with('support').first()).toJSON()
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async fifoSupport({ response }) {
    try {
      const first = await QueueController.pullSupportList()
      response.json({
        support: first,
      })
    } catch (error) {
      throw error
    }
  }

  static async pullSupportList() {
    const queue = JSON.parse(await Drive.disk('s3').get('queue-support.json'))
    const first = queue.shift()
    queue.push(first)
    await Drive.disk('s3').put('queue-support.json', Buffer.from(JSON.stringify(queue)))
    return first
  }
}

module.exports = QueueController
