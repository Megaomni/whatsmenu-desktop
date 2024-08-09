// app/Services/IFoodService.js

import Merchant from '#models/merchant'
import Order from '#models/order'
import User from '#models/user'
import env from '#start/env'
import { CancellationReasons } from '../@types/orders.js'
import { ifoodApi } from '../lib/axios.js'

/** @typedef {{ path: string; method?: "GET" | "POST"; data?:any }} IfoodRequest */

export default class IfoodService {
  /**
   * Assincronamente busca o código do usuário para autenticação.
   *
   * @return {Promise<any>} Os dados da resposta contendo o código do usuário.
   */
  static async userCode(): Promise<any> {
    try {
      const responseCode = await ifoodApi.post(
        `/authentication/v1.0/oauth/userCode?clientId=${env.get('IFOOD_CLIENT_ID')}`
      )
      return responseCode.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Função assíncrona para obter um token usando o código fornecido e as informações do usuário.
   *
   * @param {string} code - O código de autorização para a obtenção do token.
   * @param {User} user - O objeto do usuário contendo os detalhes de autenticação do ifood.
   * @return {Promise<any>} Os dados de resposta contendo as informações do token.
   */
  static async token(code: string, user: User): Promise<any> {
    try {
      let formParams

      formParams = {
        clientId: env.get('IFOOD_CLIENT_ID'),
        clientSecret: env.get('IFOOD_CLIENT_SECRET'),
        authorizationCode: code,
        authorizationCodeVerifier: user?.controls.ifood?.auth?.codeVerifier,
      }

      const responseToken = await ifoodApi.post(
        `/authentication/v1.0/oauth/token`,
        { grantType: 'authorization_code', ...formParams },
        {
          headers: {
            'content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return responseToken.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Executa uma operação de atualização de token da loja iFood.
   *
   * @param {number | string} wm_id - O identificador único para a operação.
   * @return {Promise<any>} Os dados contendo as informações atualizadas do token.
   */
  static async refreshToken(wm_id: number | string): Promise<any> {
    try {
      let formParams
      const merchant = await Merchant.findBy('wm_id', wm_id)

      if (merchant) {
        formParams = {
          clientId: env.get('IFOOD_CLIENT_ID'),
          clientSecret: env.get('IFOOD_CLIENT_SECRET'),
          refreshToken: merchant.refresh_token,
        }
      }
      const responseToken = await ifoodApi.post(
        `/authentication/v1.0/oauth/token`,
        { grantType: 'refresh_token', ...formParams },
        {
          headers: {
            'content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      return responseToken.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Salvar dados vindos do polling de eventos da loja iFood.
   *
   * @param {number | string} wm_id - O identificador único para a operação.
   * @return {Promise<any>} Os dados contendo as informações atualizadas do token.
   */
  static async polling(wm_id: number | string): Promise<any> {
    try {
      const merchant = await Merchant.findBy('wm_id', wm_id)

      const eventsPolling = await ifoodApi.get(`/events/v1.0/events:polling?groups=ORDER_STATUS`, {
        headers: {
          'Authorization': `Bearer ${merchant?.token}`,
          'x-polling-merchants': `${merchant?.merchantId}`,
        },
      })

      return eventsPolling.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera a lista de lojas associadas a loja iFood.
   *
   * @param {number | string} wmId - O WM ID da loja.
   * @return {Promise<any>} Uma promessa que resolve para os dados das lojas.
   * @throws {Error} Se ocorrer um erro ao recuperar as lojas.
   */
  static async merchants(wmId: number | string): Promise<any> {
    const merchant = await Merchant.findBy('wm_id', wmId)
    try {
      const responseMerchants = await ifoodApi.get(`merchant/v1.0/merchants`, {
        headers: {
          Authorization: `Bearer ${merchant?.token}`,
        },
      })

      return responseMerchants.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera os dados da loja iFood.
   *
   * @param {Merchant} merchant - O objeto do mercador.
   * @param {string} merchantId - O ID do comerciante.
   * @return {any} Os dados do mercador recuperado.
   */
  static async getMerchant(merchant: Merchant, merchantId: string) {
    try {
      const responseMerchantId = await ifoodApi.get(`/merchant/v1.0/merchants/${merchantId}`, {
        headers: {
          Authorization: `Bearer ${merchant?.token}`,
          Accept: 'application/json',
        },
      })

      return responseMerchantId.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera um pedido iFood.
   *
   * @param {Order} order - O objeto do pedido a ser recuperado.
   * @param {string} token - O token para autorização.
   * @return {Promise<any>} Os dados do pedido recuperado.
   */
  static async getOrder(order: Order, token: string) {
    try {
      const { data } = await ifoodApi.get(`/order/v1.0/orders/${order.orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Atualiza o status de um pedido iFood com base no status fornecido e motivo de cancelamento (quando status = 'CANCELLED') opcional.
   *
   * @param {Order} order - O pedido para atualizar o status.
   * @param {Order['orderStatus']} status - O novo status do pedido.
   * @param {CancellationReasons} [cancellationReason] - O motivo do cancelamento (opcional).
   * @return {Promise<void>} Promessa que resolve quando o status é atualizado.
   */
  static async updateStatus(
    order: Order,
    status: Order['orderStatus'],
    cancellationReason?: CancellationReasons
  ) {
    let statusEndpoint = ''
    let body: unknown = {}
    try {
      await order.load('merchant')
      switch (status) {
        case 'CONFIRMED':
          statusEndpoint = 'confirm'
          break
        case 'PREPARATION_STARTED':
          statusEndpoint = 'startPreparation'
          break
        case 'READ_TO_PICKUP':
          statusEndpoint = 'readyToPickup'
          break
        case 'DISPATCHED':
          statusEndpoint = 'dispatch'
          break
        case 'CANCELLED':
          statusEndpoint = 'requestCancellation'
          body = cancellationReason
          break
      }

      await order.load('merchant')
      await ifoodApi.post(`/order/v1.0/orders/${order.orderId}/${statusEndpoint}`, body, {
        headers: {
          Authorization: ` Bearer ${order.merchant?.token}`,
        },
      })
    } catch (error) {
      throw error
    }
  }

  static async cancellationReasons(order: Order) {
    try {
      await order.load('merchant')
      const { data } = await ifoodApi.get(
        `/order/v1.0/orders/${order.orderId}/cancellationReasons`,
        {
          headers: {
            Authorization: `Bearer ${order?.merchant?.token}`,
          },
        }
      )

      return data
    } catch (error) {
      throw error
    }
  }
}
