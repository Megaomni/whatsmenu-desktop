import Merchant from '#models/merchant'
import IfoodService from '#services/ifood_integration_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class MerchantsController {
  /**
   * Recupera a lista de lojas do serviço iFood com base no wmId fornecido.
   *
   * @param {HttpContextContract} context - O objeto de contexto HTTP.
   * @return {Promise<HttpResponseContract>} Uma promessa que resolve para a resposta HTTP com a lista de mercadores.
   * @throws {Error} Se houver um erro ao recuperar os mercadores do serviço iFood.
   */
  async merchants({ response, request }: HttpContext) {
    const { id: wmId } = request.body()
    try {
      const responseMerchants = await IfoodService.merchants(wmId)
      return response.status(200).json(responseMerchants)
    } catch (error) {
      console.error('Error fetching merchants from iFood:', error)
      throw error
    }
  }

  /**
   * Recupera o ID da loja do serviço iFood baseado nos dados da requisição.
   * @param {HttpContext} request - O objeto de requisição HTTP.
   * @return {Promise<HttpResponse>} Uma promessa que resolve para a resposta HTTP.
   * @throws {Error} Se houver um erro ao recuperar o ID do mercador.
   */
  async setMerchant({ request, response }: HttpContext) {
    try {
      const data = request.all()
      const { id, merchantId } = data
      const merchant = await Merchant.findBy('wm_id', id)
      if (!merchant) {
        return response.status(404).json({ message: 'Merchant not found' })
      }
      const responseMerchantId = await IfoodService.getMerchant(merchant, merchantId)
      merchant.merchantId = responseMerchantId.id
      merchant.name = responseMerchantId.name
      await merchant.save()
      return response.status(200).json(responseMerchantId)
    } catch (error) {
      console.error('Error fetching merchant id:', error)
      throw error
    }
  }

  /**
   * Recupera uma loja do serviço iFood pelo seu ID
   * @param {HttpContext} request - O objeto de solicitação HTTP.
   * @return {Promise<HttpResponse>} Uma promessa que é resolvida com o objeto de resposta HTTP.
   */
  async getMerchant({ request, response }: HttpContext) {
    try {
      const { id } = request.all()
      const merchant = await Merchant.findBy('wm_id', id)

      return response.status(200).json(merchant)
    } catch (error) {
      console.error('Error fetching merchant id:', error)
      throw error
    }
  }
}
