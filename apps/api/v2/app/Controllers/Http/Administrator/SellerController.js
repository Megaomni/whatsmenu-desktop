'use strict'
const Seller = use('App/Models/Seller')
const User = use('App/Models/User')

class SellerController {
  async listSellers({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'SellerController', linha: 8, metodo: 'listSellers' })
      const data = request.except('_csrf')
      let sellers

      if (data.status !== undefined) {
        sellers = await Seller.query().where('status', data.status).fetch()
      } else {
        sellers = await Seller.all()
      }

      return response.json(sellers)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = SellerController
