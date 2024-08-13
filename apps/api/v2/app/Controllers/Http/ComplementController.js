'use strict'
const Complement = use('App/Models/Complement')
const Product = use('App/Models/Product')
const moment = use('moment')

class ComplementController {
  async playPause({ request, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ComplementController', linha: 10, metodo: 'playPause' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const { complementId, complementCode } = request.all()
      const complement = await Complement.find(complementId)
      const product = await complement.products().first()
      const category = await product.category().fetch()

      if (category.profileId === profile.id) {
        const item = complement.itens.find((item) => item.code === complementCode)
        item.status = !item.status
        await complement.save()
        return response.json({
          success: true,
          item: item,
        })
      }
      response.status(403)
      return response.json({
        code: '403-1',
        message: 'This complement not available to your user!',
        success: false,
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.all(),
        error: error,
      })
      return response.json(error)
    }
  }

  async reorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ComplementController', linha: 45, metodo: 'reorder' })
      const { productId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()
      const product = await Product.find(productId)
      const complements = await product.complements().fetch()
      const category = categories.rows.find((c) => c.id === product.categoryId)

      if (category) {
        for (let index = 0; index < order.length; index++) {
          const complement = complements.rows.find((c) => c.id == order[index])
          complement.order = index
          await complement.save()
        }

        return response.json({
          success: true,
        })
      } else {
        return response.json({
          success: false,
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async itemReorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ComplementController', linha: 81, metodo: 'itemReorder' })
      const { categoryId, productId, pizzaId, complementId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()
      const complement = await Complement.find(complementId)
      const products = await complement.products().fetch()
      const category = categories.rows.find((c) => c.id === categoryId)
      let product
      let pizza
      if (productId) {
        product = products.rows.find((p) => p.id == productId)
      } else {
        pizza = category.product
      }

      if (category) {
        const itens = []

        order.forEach((code) => itens.push(complement.itens.find((i) => i.code == code)))

        complement.itens = itens
        await complement.save()

        return response.json({
          success: true,
        })
      } else {
        return response.json({
          success: false,
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = ComplementController
