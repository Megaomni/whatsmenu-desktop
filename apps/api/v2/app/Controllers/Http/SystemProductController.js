'use strict'
const SystemProduct = use('App/Models/SystemProduct')

class SystemProductController {
  async index({ response }) {
    try {
      const systemProducts = await SystemProduct.query().where({ status: 1 }).fetch()
      return response.json(systemProducts)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = SystemProductController
