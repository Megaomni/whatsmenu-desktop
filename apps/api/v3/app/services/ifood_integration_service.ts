import Profile from '#models/profile'
import { ifoodApi } from '#lib/axios'

export default class IfoodIntegrationService {
  /**
   * Uma função para recuperar o código do usuário da API do iFood.
   *
   * @return {Promise<any>} – Uma promessa que resolve os dados do código do usuário.
   */
  async userCode(): Promise<any> {
    try {
      const responseCode = await ifoodApi.get(`/ifood/userCode`)
      return responseCode.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera um token e dados de comerciantes da API do ifood.
   *
   * @param {string} code - O código de autorização obtido da API do ifood.
   * @param {Profile} profile – O objeto de perfil que contém o ID do perfil e o fuso horário.
   * @return {Promise<any[]>} - Uma promessa que é resolvida para uma série de dados de comerciantes.
   * @throws {Error} - Se houver um erro durante as chamadas da API.
   */
  async token(code: string, profile: Profile): Promise<any> {
    try {
      const responseToken = await ifoodApi.post(`/ifood/token`, { code, id: profile.id })
      let responseMerchants
      if (responseToken.data) {
        responseMerchants = await ifoodApi.post(`/ifood/merchants`, {
          timeZone: profile.timeZone,
          id: profile.id,
        })
      }

      if (responseMerchants?.data.length === 1) {
        const merchantId = responseMerchants?.data[0].id
        await ifoodApi.post(`/ifood/merchantId`, { merchantId, id: profile.id })
      }

      return responseMerchants?.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Realiza o polling de eventos.
   *
   * @param {number} id - O ID do usuário.
   * @param {Array} pollingData - Os dados de polling.
   * @return {Promise<any>} - Uma promessa que resolve os dados de eventos de polling.
   * @throws {Error} - Se ocorrer um erro durante o polling.
   */
  async polling({ pollingData, token }: { pollingData: Array<any>; token: string }): Promise<any> {
    try {
      const eventsPolling = await ifoodApi.post(`/ifood/polling`, { token, pollingData })
      return eventsPolling.data
    } catch (error) {
      throw error
    }
  }

  /**
   *  Recupera os comerciantes associados a um ID.
   *
   * @param {number} id - O ID do comerciante.
   * @return {Promise<any>} - Uma promessa que resolve os dados do comerciante.
   * @throws {Error} - Se houver um erro durante a requisição.
   */
  async merchants(id: number): Promise<any> {
    try {
      const responseMerchants = await ifoodApi.get(`/ifood/merchants/${id}`)
      return responseMerchants.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera o ID do comerciante.
   *
   * @param {number} merchantId - O ID do comerciante.
   * @param {Profile} profile – O objeto de perfil que contém o ID do perfil.
   * @return {Promise<any>} - Uma promessa que resolve os dados do comerciante.
   * @throws {Error} - Se houver um erro durante a requisição.
   */
  async merchantId(merchantId: string, profile: Profile): Promise<any> {
    try {
      const response = await ifoodApi.post(`/ifood/merchantId`, { merchantId, id: profile.id })
      // profile.options.integrations = {
      //   ifood: { created_at: DateTime.local().toISO() },
      // }
      // await profile.save()
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera os dados de um comerciante.
   *
   * @param {number} wmId - O ID do comerciante.
   * @param {string} timeZone - O fuso horário do comerciante.
   * @return {Promise<any>} - Uma promessa que resolve os dados do comerciante.
   * @throws {Error} - Se ocorrer um erro ao recuperar os dados do comerciante.
   */
  async getMerchant(wmId: number, timeZone: string): Promise<any> {
    try {
      const merchant = await ifoodApi.post(`/ifood/merchant`, { id: wmId, timeZone })
      return merchant.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera os motivos de cancelamento de um pedido.
   *
   * @param {string} orderId - O ID do pedido.
   * @return {Promise<any>} - Uma promessa que resolve os dados dos motivos de cancelamento.
   * @throws {Error} - Se ocorrer um erro ao recuperar os motivos de cancelamento.
   */
  async cancellationReasons(orderId: string): Promise<any> {
    try {
      const responseCancellationReasons = await ifoodApi.get(
        `/ifood/order/${orderId}/cancellationReasons`
      )
      return responseCancellationReasons.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Uma função para recuperar dados do iFood.
   *
   * @param {Profile} profile – As informações do perfil do usuário.
   * @param {string} timeZone – O fuso horário do perfil do usuário.
   * @param {number} id – O ID do perfil do usuário.
   * @return {Promise<any>} Uma promessa assíncrona com os dados de pedidos recuperados.
   * @throws {Error} Se houver um erro durante a requisição.
   */
  async getOrdersData(profile: Profile): Promise<any> {
    try {
      const responseGetOrders = await ifoodApi.post(`/ifood/ordersData`, {
        timeZone: profile.timeZone,
        id: profile.id,
      })
      return responseGetOrders.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Atualiza o status de um pedido.
   *
   * @param {string} orderId - O ID do pedido.
   * @param {string} status - O novo status do pedido.
   * @param {Object} cancellationReason - O motivo e o código de cancelamento do pedido.
   * @return {Promise<any>} - Uma promessa que resolve os dados da atualização do status.
   * @throws {Error} - Se ocorrer um erro durante a atualização do status.
   */
  async updateStatus({
    orderId,
    status,
    cancellationReason,
  }: {
    orderId: string
    status: string
    cancellationReason?: Object
  }): Promise<any> {
    try {
      const response = await ifoodApi.post(`/ifood/order/updateStatus`, {
        orderId,
        status,
        cancellationReason,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}
