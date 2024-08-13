'use strict'
const Profile = use('App/Models/Profile')
const Client = use('App/Models/Client')

class ClientCheck {
  async handle({ params, request, response }, next) {
    // call next to advance the request
    try {
      const { slug } = params
      const { client, clientId } = request.all()
      const profile = await Profile.findBy('slug', slug)

      let id
      if (client && client.id) {
        id = client.id
      } else {
        id = clientId
      }

      if (id) {
        const updatedClient = await Client.query().where('id', id).where('profileId', profile.id).first()

        if (!updatedClient) {
          return response.status(404).json({ message: 'Cliente não encontrado' })
        }
      }

      if (client && client.whatsapp) {
        const haveClient = await Client.query()
          .where({
            profileId: profile.id,
            whatsapp: client.whatsapp,
          })
          .first()
        if (haveClient && id != haveClient.id) {
          return response.status(409).json({ success: false, message: 'Já existe um cliente com esse whatsapp' })
        }
      }
    } catch (error) {
      console.error(error)
    }
    await next()
  }
}

module.exports = ClientCheck
