'use strict'
const Profile = use('App/Models/Profile')
const Request = use('App/Models/Request')

class RequestController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  onOpen() {
    console.log('Starting: ', { controller: 'RequestController', linha: 12, metodo: 'onOpen' })
  }

  onRequest(request) {
    // console.log(request)
    console.log('Starting: ', { controller: 'RequestController', linha: 18, metodo: 'onRequest' })
    if (request.status) {
      // console.log(request)
    } else {
      console.log({
        code: request.code,
        slug: request.slug,
        total: request.total,
      })

      this.create(request)
        .then((newRequest) => {
          if (newRequest) {
            // this.socket.id
            // console.log(this.socket.topic)
            // console.log(this.socket.subscriptions(`request:${request.slug}`))
            // const topic = this.socket.topic(request.slug)
            this.socket.broadcast(`request:${request.slug}`, newRequest)
          }
        })
        .catch((error) => console.error(error))
    }
  }

  async create(dados) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 45, metodo: 'create' })
      const profile = await Profile.findBy('slug', dados.slug)
      let request = await Request.query()
        .where({
          profileId: profile.id,
          code: dados.code,
        })
        .first()

      if (!request) {
        request = await Request.create({
          profileId: profile.id,
          code: dados.code,
          name: dados.client.name,
          contact: dados.client.contact,
          deliveryAddress: {
            zipCode: dados.client.zipCode,
            street: dados.client.street,
            number: dados.client.number,
            complement: dados.client.complement,
            neighborhood: dados.client.neighborhood,
            reference: dados.client.reference,
            city: dados.client.city,
            latitude: dados.client.latitude,
            longitude: dados.client.longitude,
            distance: dados.client.distance,
          },
          cart: dados.cart,
          cartPizza: dados.cartPizza,
          formPayment: dados.client.formPayment,
          typeDelivery: dados.typeDelivery,
          taxDelivery: dados.taxDeliveryValue !== null ? dados.taxDeliveryValue : 0,
          timeDelivery: dados.timeDelivery ? dados.timeDelivery : 0,
          transshipment:
            dados.client.transshipment && parseFloat(dados.client.transshipment.replace(',', '.').trim()) != NaN
              ? parseFloat(dados.client.transshipment.replace(',', '.').trim())
              : 0,
          total: dados.total,
        })

        const rqt = request.toJSON()
        rqt.cart = JSON.parse(rqt.cart)
        rqt.cartPizza = JSON.parse(rqt.cartPizza)
        rqt.deliveryAddress = JSON.parse(rqt.deliveryAddress)

        return rqt
      }

      return undefined
    } catch (error) {
      console.error({
        date: new Date(),
        data: dados,
        error: error,
      })
      return {
        date: new Date(),
        error: error,
      }
    }
  }
}

module.exports = RequestController
