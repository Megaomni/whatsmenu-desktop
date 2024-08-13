'use strict'
const ClientAddress = use('App/Models/ClientAddress')

class AddressCheck {

  async handle({ params, response }, next) {
    // call next to advance the request
    try {
      const { clientId, addressId } = params
      const address = await ClientAddress.query().where('id', addressId).where('clientId', clientId).first()

      if (!address) {
        return response.status(404).json({ message: 'Endereço não encontrado' })
      }
    } catch (error) {
      console.error(error);
    }
    await next()
  }
}

module.exports = AddressCheck
