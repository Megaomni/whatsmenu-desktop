'use strict'

const moment = use('moment')

const CartIten = use('App/Models/CartIten')
class CartItenController {
  async delete({ params, response }) {
    try {
      const { cartId, itemId } = params
      const item = await CartIten.query().where({
        cartId,
        id: itemId
      }).first()

      if (!item) {
        return response.status(404).json({ message: 'Item não encontrado' })
      }

      if (item.deleted_at) {
        return response.status(208).json({ message: 'Este item já foi deletado', item })
      }

      item.deleted_at = moment().format('YYYY-MM-DD HH:mm:ss')
      await item.save()
      
      return response.status(202).json({ message: 'Item deletedo com sucesso.' })
    } catch (error) {
      console.error(error);
      throw error
    }
  }

  async edit({ params, request,response }) {
    const data = request.except(['_csrf', '_method'])

    try {
      const { cartId, itemId } = params
      const item = await CartIten.query().where({
        cartId,
        id: itemId
      }).first()

      if (!item) {
        return response.status(404).json({ message: 'Item não encontrado' })
      }

      if (!item.deleted_at) {
        item.merge(data)
      } else {
        return response.status(403).json({ message: 'Este item já foi deletado' })
      }

      return response.json(item)
    } catch (error) {
      console.error(error);
      throw error
    }
  }

}

module.exports = CartItenController
