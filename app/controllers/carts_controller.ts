import Cart from '#models/cart'
import { HttpContext } from '@adonisjs/core/http'

export default class CartsController {
  /**
   * Função assíncrona para obter o status de um carrinho.
   *
   * @param {HttpContext} params - Objeto contendo parâmetros passados para a função, incluindo o cartId.
   * @param {HttpContext} response - Objeto representando a resposta HTTP.
   * @return {Promise<void>} O status do carrinho como uma resposta JSON.
   */
  async statusCart({ params, response }: HttpContext): Promise<void> {
    try {
      const { cartId } = params
      const cart = await Cart.query({ connection: 'mysql_pooling' }).where('id', cartId).first()

      if (!cart) {
        return response.status(404).json({ error: 'Carrinho não encontrado' })
      }
      return response.status(200).json({ id: cart.id, status: cart.status })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
