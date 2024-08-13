'use strict'

const { default: axios } = require("axios")

const Profile = use('App/Models/Profile')
const Client = use('App/Models/Client')
const ClientAddress = use('App/Models/ClientAddress')
const moment = use('moment')
class ClientAddressController {
  async create({ params, request, response }) {
    try {
      const { clientId } = params
      const addressData = request.except(['_csrf', '_method'])

      await this.getDistance({ address: addressData, clientId })

      const address = await ClientAddress.create({
        clientId,
        ...addressData
      })
      return response.status(201).json({ address })
    } catch (error) {
      console.error(error);
      throw error
    }
  }
  async update({ params, request, response }) {
    try {
      const { clientId, addressId } = params
      const addressData = request.except(['_csrf', '_method'])
      const address = await ClientAddress.query().where('id', addressId).where('clientId', clientId).first()
      delete addressData.controls
      delete addressData.deleted_at
      delete addressData.updated_at
      await this.getDistance({ address: addressData, clientId })
      await address.merge(addressData)
      await address.save()

      return response.status(200).json({ address })
    } catch (error) {
      console.error(error);
      throw error
    }
  }
  async delete({ params, response }) {
    try {
      const { clientId, addressId } = params
      const address = await ClientAddress.query().where('id', addressId).where('clientId', clientId).first()
      if (address.deleted_at) {
        return response.status(208).json({ message: 'Este endereço já foi deletado', address })
      }

      address.deleted_at = moment().format('YYYY-MM-DD HH:mm:ss')

      await address.save()

      return response.status(200).json({ message: 'Endereço deletado com sucesso.', success: true })
    } catch (error) {
      console.error(error);
      throw error
    }
  }

  async getDistance({ address, clientId }) {
    try {
      const client = await Client.find(clientId)
      const profile = await client.profile().fetch()
      if (profile.typeDelivery === 'km') {
        const matrix = {
          origin: `${profile.address.street}, ${profile.address.number} - ${profile.address.neigborhood}, ${profile.address.city} - ${profile.address.state}`,
          // destination: addressdata.textAddress,
          destination: `${address.street}${address.number !== 'SN' ? `, ${address.number}` : ''} - ${address.neighborhood}, ${address.city} - ${
            address.uf
          }`,
        }

        if (address.zipCode) {
          matrix.destination += `,CEP${address.zipCode.replace('-', '')}, Brazil`
        } else {
          matrix.destination += `, Brazil`
        }

        if (profile.address.zipcode) {
          matrix.origin += `,CEP${profile.address.zipcode.replace('-', '')}, Brazil`
        } else {
          matrix.origin += `, Brazil`
        }

        const { origin, destination } = matrix

        const { data } = await axios.post('https://api2.whatsmenu.com.br/api/v2/calc/distance', {
          origin,
          destination
        })

        if (!profile.taxDelivery.some((tax) => tax.distance >= data.distance / 1000)) {
          console.error(JSON.stringify(data));
          throw new Error('Endereço fora da área de cobertura')
        }

        address.distance = data.distance
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = ClientAddressController
