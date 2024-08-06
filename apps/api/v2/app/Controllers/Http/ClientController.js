'use strict'

const { default: axios } = require('axios')

const Env = use('Env')
const Profile = use('App/Models/Profile')
const Client = use('App/Models/Client')
const CartR = use('App/Models/ReadOnly/Cart')
const ClientR = use('App/Models/ReadOnly/Client')
const ClientAddress = use('App/Models/ClientAddress')

class UserAdmClientController {
  async list({ params, request, response }) {
    try {
      const { profile } = params
      let clients = []

      const query = Object.entries(request.qs)

      if (query.length) {
        const [[filter, value]] = query

        switch (filter) {
          case 'whatsapp':
            clients = await ClientR.query()
              .where({
                profileId: profile.id,
                whatsapp: value,
              })
              .with('addresses', (addr) => {
                addr.whereNull('deleted_at')
              })
              .fetch()
            break
          case 'name':
            clients = await ClientR.query()
              .where('profileId', profile.id)
              .where('name', 'like', `%${value}%`)
              .with('addresses', (addr) => {
                addr.whereNull('deleted_at')
              })
              .fetch()
            break
          default:
            clients = await ClientR.query()
              .where('profileId', profile.id)
              .with('addresses', (addr) => {
                addr.whereNull('deleted_at')
              })
              .fetch()
            break
        }
      } else {
        clients = await ClientR.query()
          .where('profileId', profile.id)
          .with('addresses', (addr) => {
            addr.whereNull('deleted_at')
          })
          .fetch()
      }

      if (!clients.rows.length) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }

      console.log(clients)
      const sanitizedClients = clients.toJSON().map((client) => {
        if (client.controls.asaas && client.controls.asaas.cards.length) {
          client.controls.asaas.cards.forEach((card) => {
            delete card.creditCardToken
            delete card.uuid
          })
        }
        return client
      })

      console.log(sanitizedClients)

      return response.json(sanitizedClients)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async findOne({ params, request, response }) {
    try {
      const { profile, clientId } = params

      const client = await ClientR.query()
        .where({ profileId: profile.id, id: clientId })
        .with('addresses', (addr) => {
          addr.whereNull('deleted_at')
        })
        .first()

      if (client) {
        const requestsIds = client.last_requests.map((request) => request.id)
        client.last_requests = await CartR.query().whereIn('id', requestsIds).with('cupom').fetch()
      }

      if (!client) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }

      if (client.controls.asaas && client.controls.asaas.cards.length)
        client.controls.asaas.cards.forEach((card) => {
          delete card.creditCardToken
          delete card.uuid
        })

      return response.json({ client })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async create({ params, request, response }) {
    try {
      const { slug } = params
      const { client, addresses } = request.except(['_csrf'])
      client.birthday_date = client.birthday_date ? client.birthday_date : null
      const profile = await Profile.findBy('slug', slug)
      const newClient = await Client.create({
        profileId: profile.id,
        ...client,
      })
      newClient.vouchers = []

      await this.generateAddresses(addresses, profile, newClient, 'create')
      newClient.addresses = await newClient.addresses().fetch()

      return response.status(201).json({ client: newClient })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async update({ params, request, response }) {
    try {
      const { slug, clientId } = params
      const { client, clientAddresses, addresses } = request.except(['_csrf'])
      const profile = await Profile.findBy('slug', slug)
      const updatedClient = await Client.query()
        .where({
          id: clientId,
          profileId: profile.id,
        })
        .first()


        await updatedClient.merge(client)
        await updatedClient.save()

        if (updatedClient) {
          const requestsIds = updatedClient.last_requests.map((request) => request.id)
          updatedClient.last_requests = await CartR.query().whereIn('id', requestsIds).with('cupom').fetch()
        }

        const updatedAddresses = await this.generateAddresses(clientAddresses, profile, updatedClient, 'update')
        const newAddresses = await this.generateAddresses(addresses, profile, updatedClient, 'create')

        updatedClient.addresses = [...updatedAddresses, ...newAddresses]

      return response.status(200).json({ client: updatedClient })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async generateAddresses(addresses, profile, client, action) {
    const result = []
    try {
      if (addresses && addresses.length) {
        const { address: restaurant } = profile
        for (let address of addresses) {
          if (address.update && action === 'update') {
            if (profile.typeDelivery) {
              address.distance = await this.getAddressDistance(address, restaurant)
            }
            const updateAddress = await ClientAddress.find(address.id)
            delete address.deleted_at
            delete address.updated_at
            delete address.update
            await updateAddress.merge(address)
            await updateAddress.save()
            address = updateAddress
          }
          if (action === 'create') {
            delete address.id
            delete address.update
            if (profile.typeDelivery) {
              address.distance = await this.getAddressDistance(address, restaurant)
            }
            address = await ClientAddress.create({
              clientId: client.id,
              ...address,
            })
          }
          result.push(address)
        }
      }
      if (action === 'update') {
        delete client.addresses
      }
    } catch (error) {
      console.error(error)
      throw error
    }
    return result
  }

  async getAddressDistance(address, restaurant) {
    if (address.street) {
      const origin = encodeURI(
        `${restaurant.street}${restaurant.number ? ',' + restaurant.number : ''} - ${restaurant.neigborhood}, ${restaurant.city} - ${restaurant.uf}${
          restaurant.zipcode ? ', CEP' + restaurant.zipcode : ''
        }, Brazil`
      )
      const destination = encodeURI(
        `${address.street}${address.number ? ',' + address.number : ''} - ${address.neighborhood}, ${address.city} - ${address.uf}${
          address.zipcode ? ', CEP' + address.zipcode : ''
        }, Brazil`
      )
      const req = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg`
      )
      return req.data.rows[0].elements[0].distance.value
    }
  }

  async savePushSubscription({ request, response }) {
    console.log('Starting: ', { controller: 'ClientController', linha: 221, metodo: 'savePushSubscription' })
    try {
      const { subscription, clientId, userAgent } = request.all()
      const result = await axios.post(
        `${Env.get('PUSH_SERVICE_URL')}/subscriptions/saveSubscription`,
        { subscription, clientId, userAgent },
        { headers: { Authorization: `Bearer ${Env.get('PUSH_SERVICE_TOKEN')}` } }
      )
      return response.status(result.status).json({ ...result.data })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = UserAdmClientController
