'use strict'
const Database = use('Database')
const Requests = use('App/Models/Request')

class AdmClientController {

  async index({auth, response, view}) {
    try {
      console.log('Starting: ', { controller: 'AdmClientController', linha: 9, metodo: 'index' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      let requests = await profile.requests().fetch()
      requests = requests.toJSON()
      const numbers = [... new Set(requests.map(r => r.contact))]
      const clients = []
      for (let number of numbers) {
        const filtred = requests.filter(r => r.contact === number)
        clients.push({
          name: filtred[0].name,
          contact: number,
          requests: filtred
        })
      }
      // console.log(clients)

      response.send(
        view.render('inner.clients.index', {
          profile: profile.toJSON(),
          requests: clients
        })
      )
    } catch (error) {
      console.error({
        date: new Date(),
        error: error
      })
      response.status(500)
      response.json(error)
    }
  }
}

module.exports = AdmClientController
