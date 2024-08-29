import { HttpContext } from '@adonisjs/core/http'
import IfoodIntegrationService from '#services/ifood_integration_service'
import Profile from '#models/profile'
import { DateTime } from 'luxon'

export default class IfoodIntegrationsController {
  private ifoodService: IfoodIntegrationService
  constructor() {
    this.ifoodService = new IfoodIntegrationService()
  }
  /**
   * De forma assíncrona, recupera o código do usuário do serviço iFood.
   *
   * @return {Object} Objeto contendo o código do usuário e URL de verificação
   * @throws {Error} Se houver um erro ao realizar a consulta
   */
  async authUserCode(): Promise<any> {
    try {
      const responseCode = await this.ifoodService.userCode()
      return {
        userCode: responseCode.userCode,
        verificationUrl: responseCode.verificationUrl,
      }
    } catch (error) {
      console.error('Error fetching user code from iFood:', error)
      throw error
    }
  }

  /**
   * Uma função para autenticar o token do usuário.
   *
   * @param {HttpContext} request - O objeto HttpContext contendo request, response e auth
   * @return {Promise<void>} Retorna uma resposta JSON com os merchants
   * @throws {Error} Se houver um erro ao realizar a consulta
   */
  async authToken({ request, response, auth }: HttpContext): Promise<void> {
    try {
      await auth.user?.load('profile')
      const profile = auth.user?.profile
      const { code } = request.all()
      let merchants

      if (profile) {
        merchants = await this.ifoodService.token(code, profile!)
      }

      if (profile && merchants.length === 1) {
        profile.options.integrations = {
          ifood: { created_at: DateTime.now().toISO() },
        }
        await profile.save()
      }

      return response.status(200).json({ merchants })
    } catch (error) {
      console.error('Error fetching user token from iFood:', error)
      throw error
    }
  }

  /**
   * Realiza uma consulta assíncrona ao serviço do iFood em busca de novos pedidos.
   *
   * @param {HttpContext} request - O objeto de requisição HTTP contendo os dados de consulta e ID.
   * @return {Promise<any>} Uma Promessa que é resolvida com os novos pedidos recuperados do serviço do iFood.
   * @throws {Error} Se houver um erro ao realizar a consulta
   */
  async polling({ response, request }: HttpContext): Promise<any> {
    try {
      const { pollingData, token } = request.all()

      const eventsPolling = await this.ifoodService.polling({ pollingData, token })

      // const orders = eventsPolling.orders.filter((order: any) => order.orderStatus === 'PLACED')

      return response
        .status(200)
        .json({ orders: eventsPolling.orders, merchant: eventsPolling.merchant })
    } catch (error) {
      console.error('Erro ao fazer polling no iFood:', error)
      throw error
    }
  }

  /**
+   * Recupera os lojas do serviço iFood de forma assíncrona.
+   *
+   * @param {HttpContext} context - O objeto HttpContext contendo a requisição, resposta e autenticação.
+   * @param {Auth} auth - O objeto de autenticação.
+   * @return {Promise<any>} Uma promessa que é resolvida com as lojas recuperadas do serviço iFood.
+   * @throws {Error} Se houver um erro ao recuperar as lojas do serviço iFood.
+   */
  async merchants({ response, auth }: HttpContext): Promise<any> {
    try {
      await auth.user?.load('profile')
      const profile = auth.user?.profile
      let responseMerchants
      if (profile) {
        responseMerchants = await this.ifoodService.merchants(profile.id)
      }

      return response.status(200).json(responseMerchants)
    } catch (error) {
      console.error('Error fetching merchants from iFood:', error)
      throw error
    }
  }

  /**
   * Realiza a busca do ID do comerciante e atualiza as informações de integração do perfil.
   *
   * @param {HttpContext} request - O objeto HttpContext contendo a requisição, resposta e autenticação.
   * @param {Auth} auth - O objeto de autenticação.
   * @return {Promise<any>} Retorna o ID do comerciante buscado e atualiza as informações de integração do perfil.
   * @throws {Error} Se houver um erro ao buscar o ID do comerciante.
   */
  async merchantId({ request, response, auth }: HttpContext): Promise<any> {
    try {
      await auth.user?.load('profile')
      const profile = auth.user?.profile

      const { merchantId } = request.all()
      const responseMerchantId = await this.ifoodService.merchantId(merchantId, profile!)

      if (responseMerchantId && profile) {
        profile.options.integrations = {
          ifood: { created_at: DateTime.now().toISO() },
        }
        await profile.save()
      }

      return response
        .status(200)
        .json({ responseMerchantId, integrations: profile?.options.integrations })
    } catch (error) {
      console.error('Error fetching merchant id:', error)
      throw error
    }
  }

  /**
   * Recupera um comerciante com base no slug fornecido.
   *
   * @param {HttpContext} request - O objeto de contexto HTTP contendo as informações de requisição, resposta e autenticação.
   * @return {Promise<any>} Uma promessa que resolve para os dados do comerciante.
   * @throws {Error} Se houver um erro ao buscar o comerciante.
   */
  async getMerchant({ request, response }: HttpContext): Promise<any> {
    try {
      const { slug } = request.all()
      const profile = await Profile.findBy('slug', slug)
      const merchant = await this.ifoodService.getMerchant(profile?.id!, profile?.timeZone!)

      return response.status(200).json(merchant)
    } catch (error) {
      console.error('Error fetching merchant:', error)
      throw error
    }
  }

  /**
   * Recupera os motivos de cancelamento de um determinado pedido.
   *
   * @param {HttpContext} request - O objeto de contexto HTTP contendo as informações de requisição, resposta e autenticação.
   * @param {HttpContext} params - O objeto de parâmetros HTTP contendo os parâmetros da requisição.
   * @return {Promise<void>} Uma promessa que resolve os motivos do cancelamento.
   * @throws {Error} Se houver um erro ao buscar os motivos de cancelamento.
   */
  async cancellationReasons({ params, request, response }: HttpContext): Promise<void> {
    try {
      const { orderId } = params
      const responseCancellationReasons = await this.ifoodService.cancellationReasons(orderId)

      return response.status(200).json(responseCancellationReasons)
    } catch (error) {
      console.error('Error when getting reason for order cancellation:', error)
      throw error
    }
  }

  /**
   * Uma função para recuperar dados de pedidos.
   *
   * @param {HttpContext} request - O contexto HTTP que contém a requisição, a resposta e as informações de autenticação.
   * @param {HttpContext} auth – O contexto HTTP que contém informações de autenticação.
   * @return {Promise<any>} Uma promessa que resolve os dados do pedido.
   * @throws {Error} Se houver um erro ao buscar os dados do pedido.
   */
  async getOrdersData({ response, auth }: HttpContext): Promise<any> {
    try {
      await auth.user?.load('profile')
      const profile = auth.user?.profile
      const ifoodData = await this.ifoodService.getOrdersData(profile!)

      return response.status(200).json(ifoodData)
    } catch (error) {
      console.error('Fail geting orders', error)
      throw error
    }
  }

  /**
   * Atualiza o status de um pedido.
   *
   * @param {HttpContext} request - O contexto HTTP que contém a solicitação, a resposta e as informações de autenticação.
   * @param {HttpContext} params - O objeto de parâmetros HTTP contendo os parâmetros da requisição.
   * @return {Promise<any>} Uma promessa que resolve o status atualizado do pedido.
   * @throws {Error} Se houver um erro ao atualizar o status do pedido.
   */
  async updateStatus({ request, response, params }: HttpContext): Promise<any> {
    try {
      const { orderId } = params
      const { status, cancellationReason } = request.all()
      const result = await this.ifoodService.updateStatus({ orderId, status, cancellationReason })

      return response.status(200).json(result)
    } catch (error) {
      console.error('Error updating order status:', error.response.data)
      throw error
    }
  }
}
