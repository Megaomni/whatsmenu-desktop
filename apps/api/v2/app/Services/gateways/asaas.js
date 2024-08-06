'use strict'

const axios = require('axios')
const CartController = use('App/Controllers/Http/CartController')
const Env = use('Env')
const Ws = use('Ws')

const Command = use('App/Models/Command')
const TableOpened = use('App/Models/TableOpened')
const Cart = use('App/Models/Cart')

/** @typedef {{ path: string; method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH"; data?:any }} AsaasRequest */
/** @typedef {{ name: string; cpfCnpj:string; email:string; mobilePhone:string; address:string; addressNumber:string; complement?:string; province:string; postalCode:string; webhooks?:any[] }} Customer */
/** @typedef {{ customer: string; billingType:"BOLETO" | "CREDIT_CARD" | "PIX"; value:number; dueDate:string; split:Split[] }} Payment */
/** @typedef {{ walletId: string; fixedValue?:number; percentualValue?:number }} Split */

class Asaas {
  constructor() {}

  /**
   * Função para construir a request na API da ASAAS.
   * @param {AsaasRequest} param
   */
  static async asaasRequest({ path, method = 'GET', params, data, token }) {
    try {
      const { data: response } = await axios({
        method,
        url: new URL(path, Env.get('ASAAS_API_URL')).href,
        data,
        params,
        headers: {
          access_token: token || `$${token || Env.get('ASAAS_API_KEY')}==`,
        },
      })
      return response
    } catch (error) {
      console.error(error)
      if (error.response.data.errors) {
        throw new Error(error.response.data.errors.map((err) => err.description).join(', '))
      }
      throw new Error('Não foi possivel conectar com a API da ASAAS')
    }
  }

  static webhooks(email) {
    const webHookTypes = [
      { type: 'ACCOUNT_STATUS', slug: 'accounts' },
      { type: 'TRANSFER', slug: 'transfers' },
      { type: 'PAYMENT', slug: 'payments' },
      { type: 'INVOICE', slug: 'invoices' },
    ]
    return webHookTypes.map((type) => ({
      url: `${Env.get('ASAAS_WEBHOOK_URL')}/asaas/${type.slug}`,
      email,
      interrupted: false,
      enabled: true,
      apiVersion: 3,
      type: type.type,
    }))
  }

  /**
   * Função para criar um cliente.
   * @param {Customer} body
   */
  static async createCustomer(body) {
    try {
      const customer = await this.asaasRequest({ path: 'customers', method: 'POST', data: body })
      const messages = await Asaas.findNotificationsByCustomer(customer.id)
      for (const message of messages.data) {
        if (message.enabled) {
          await Asaas.updateNotification({ enabled: false }, message.id)
        }
      }
      return customer
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para obter lista de clientes baseado no filtro.
   * @param {string} filter
   * @param {string} parameter
   * @param {number} offset
   * @param {number} limit
   */
  static async listCustomers(filter, parameter, offset, limit) {
    try {
      return await this.asaasRequest({ path: `customers/`, params: filter ? { [filter]: parameter, offset, limit } : null, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para obter informações de um cliente.
   * @param {string} customerId
   */
  static async findCustomer(customerId) {
    try {
      return await this.asaasRequest({ path: `customers/${customerId}`, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para obter informações das notificações de um cliente.
   * Retorna um array  de Notificações
   * @param {string} customerId
   */
  static async findNotificationsByCustomer(customerId) {
    try {
      return await this.asaasRequest({ path: `customers/${customerId}/notifications`, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para atualizar um cliente.
   * @param {Customer} body
   * @param {string} customerId
   */
  static async updateCustomer(body, customerId) {
    try {
      return await this.asaasRequest({ path: `customers/${customerId}`, method: 'POST', data: body })
    } catch (error) {
      throw error
    }
  }
  /**
   * Função para atualizar a notificação de um cliente.
   * @param {Customer} body
   * @param {string} notificationId
   */
  static async updateNotification(body, notificationId) {
    try {
      return await this.asaasRequest({ path: `notifications/${notificationId}`, method: 'PUT', data: body })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para deletar um cliente.
   * @param {string} customerId
   */
  static async deleteCustomer(customerId) {
    try {
      return await this.asaasRequest({ path: `customers/${customerId}`, method: 'DELETE' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para restaurar um cliente removido.
   * @param {string} customerId
   */
  static async restoreCustomer(customerId) {
    try {
      return await this.asaasRequest({ path: `customers/${customerId}/restore`, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para criar uma subconta.
   * @param {Customer} body
   */
  static async createAccount(body) {
    try {
      return await this.asaasRequest({ path: 'accounts', method: 'POST', data: { ...body } })
    } catch (error) {
      throw error
    }
  }

  static async getAccount(accountId) {
    try {
      return await this.asaasRequest({ path: `accounts?id=${accountId}` })
    } catch (error) {
      throw error
    }
  }

  static async updateAccount(token, body) {
    try {
      return await this.asaasRequest({ path: 'myAccount/commercialInfo', method: 'PUT', data: { ...body }, token })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para criar uma subconta.
   * @param {Customer} body
   */
  static async listDocuments() {
    try {
      return await this.asaasRequest({ path: 'myAccount/documents', method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para listar subcontas.
   * @param {string} filter
   * @param {string} parameter
   * @param {number} offset
   * @param {number} limit
   */
  static async listAccounts(filter, parameter, offset, limit) {
    try {
      return await this.asaasRequest({ path: `accounts/`, params: filter ? { [filter]: parameter, offset, limit } : null, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para obter informações de uma subconta.
   * @param {string} id
   */
  static async findAccount(id) {
    try {
      return await this.asaasRequest({ path: `accounts/?id=${id}`, method: 'GET' })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para criar uma chave PIX para a conta.
   * @param {string} accessToken
   */
  static async createPIXkey(accessToken) {
    try {
      return await this.asaasRequest({ path: `pix/addressKeys`, method: 'POST', token: accessToken, data: { type: 'EVP' } })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para listar todas as chaves pix de uma conta.
   * @param {string} accessToken
   */
  static async listPIXKeys(accessToken) {
    try {
      return await this.asaasRequest({ path: `pix/addressKeys`, method: 'GET', token: accessToken })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para criar um pagamento individual.
   * @param {Payment} body
   */
  static async createPayment(body) {
    try {
      return await this.asaasRequest({ path: 'payments', method: 'POST', data: body })
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Função para intermediar antecipação de pagamento.
   * @param {string} body
   */
  static async createPaymentAnticipation(body) {
    try {
      return await this.asaasRequest({ path: 'anticipations', method: 'POST', data: body })
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para criar um pagamento individual.
   */
  static async createCardToken(body) {
    try {
      console.log('createCardToken payload:', body)
      return await this.asaasRequest({ path: 'creditCard/tokenize', method: 'POST', data: body })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * Função para gerar qrCode de uma cobrança PIX.
   * @param {string} paymentId
   */
  static async qrCodePix(paymentId) {
    try {
      const qrCode = await this.asaasRequest({ path: `payments/${paymentId}/pixQrCode`, method: 'GET' })
      return qrCode
    } catch (error) {
      throw error
    }
  }

  /**
   * Função para ler o saldo da conta.
   * @param {string} accessToken
   */
  static async verifyAccountBalance(accessToken) {
    try {
      return await this.asaasRequest({ path: `finance/balance`, method: 'GET', token: accessToken })
    } catch (error) {
      throw error
    }
  }

  static async webHookHandler(event) {
    try {
      console.log('WEBHOOK: ', event)
      const relevantEvents = new Set([
        'PAYMENT_CREATED',
        'PAYMENT_AWAITING_RISK_ANALYSIS',
        'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
        'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
        'PAYMENT_UPDATED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_RECEIVED',
        'PAYMENT_ANTICIPATED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_RESTORED',
        'PAYMENT_REFUNDED',
        'PAYMENT_REFUND_IN_PROGRESS',
        'PAYMENT_RECEIVED_IN_CASH_UNDONE',
        'PAYMENT_CHARGEBACK_REQUESTED',
        'PAYMENT_CHARGEBACK_DISPUTE',
        'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
        'PAYMENT_DUNNING_RECEIVED',
        'PAYMENT_DUNNING_REQUESTED',
        'PAYMENT_BANK_SLIP_VIEWED',
        'PAYMENT_CHECKOUT_VIEWED',
      ])

      if (relevantEvents.has(event.event)) {
        switch (event.event) {
          case 'PAYMENT_CREATED':
            // Handle PAYMENT_CREATED logic here
            break
          case 'PAYMENT_AWAITING_RISK_ANALYSIS':
            // Handle PAYMENT_AWAITING_RISK_ANALYSIS logic here
            break
          case 'PAYMENT_APPROVED_BY_RISK_ANALYSIS':
            // Handle PAYMENT_APPROVED_BY_RISK_ANALYSIS logic here
            break
          case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
            // Handle PAYMENT_REPROVED_BY_RISK_ANALYSIS logic here
            break
          case 'PAYMENT_UPDATED':
            // Handle PAYMENT_UPDATED logic here
            break
          case 'PAYMENT_CONFIRMED':
            // Handle PAYMENT_CONFIRMED logic here
            await this.paymentReceivedWebhook(event)
            break
          case 'PAYMENT_RECEIVED':
            await this.paymentReceivedWebhook(event)
            break
          case 'PAYMENT_ANTICIPATED':
            // Handle PAYMENT_ANTICIPATED logic here
            break
          case 'PAYMENT_OVERDUE':
            // Handle PAYMENT_OVERDUE logic here
            break
          case 'PAYMENT_DELETED':
            // Handle PAYMENT_DELETED logic here
            break
          case 'PAYMENT_RESTORED':
            // Handle PAYMENT_RESTORED logic here
            break
          case 'PAYMENT_REFUNDED':
            // Handle PAYMENT_REFUNDED logic here
            break
          case 'PAYMENT_REFUND_IN_PROGRESS':
            // Handle PAYMENT_REFUND_IN_PROGRESS logic here
            break
          case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
            // Handle PAYMENT_RECEIVED_IN_CASH_UNDONE logic here
            break
          case 'PAYMENT_CHARGEBACK_REQUESTED':
            // Handle PAYMENT_CHARGEBACK_REQUESTED logic here
            break
          case 'PAYMENT_CHARGEBACK_DISPUTE':
            // Handle PAYMENT_CHARGEBACK_DISPUTE logic here
            break
          case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
            // Handle PAYMENT_AWAITING_CHARGEBACK_REVERSAL logic here
            break
          case 'PAYMENT_DUNNING_RECEIVED':
            // Handle PAYMENT_DUNNING_RECEIVED logic here
            break
          case 'PAYMENT_DUNNING_REQUESTED':
            // Handle PAYMENT_DUNNING_REQUESTED logic here
            break
          case 'PAYMENT_BANK_SLIP_VIEWED':
            // Handle PAYMENT_BANK_SLIP_VIEWED logic here
            break
          case 'PAYMENT_CHECKOUT_VIEWED':
            // Handle PAYMENT_CHECKOUT_VIEWED logic here
            break
          default:
            console.error('Unknown payment event type:', event.event)
        }
      }
    } catch (error) {
      throw error
    }
  }

  static async paymentReceivedWebhook(event) {
    try {
      console.log(`profile:${event.payment.id}`)
      const orderTopic = Ws.getChannel('profile:*').topic(`profile:${event.payment.id}`)

      if (!event.payment.externalReference) {
        console.error(`PAYMENT_EXTERNAL_REFERENCE_NOT_FOUND: ${event.payment.id}`)
        return
      }

      const { cartId, commandId, tableId } = JSON.parse(event.payment.externalReference)
      if (cartId) await CartController.changeOrderPaymentStatus(cartId, 'paid')

      const setPaymentPaid = (formsPayment) => {
        const payment = formsPayment.find((f) => f.paymentId === event.payment.id)
        if (payment) {
          payment.paid = true
        }
      }

      const data = { paid: true }
      if (cartId) {
        data.cart = await Cart.find(cartId)
        setPaymentPaid(data.cart.formsPayment)
        await data.cart.save()
      }
      if (commandId) {
        data.command = await Command.find(commandId)
        setPaymentPaid(data.command.formsPayment)
        await data.command.save()
      }
      if (tableId) {
        data.table = await TableOpened.find(tableId)
        setPaymentPaid(data.table.formsPayment)
        await data.table.save()
      }

      if (!orderTopic) return
      orderTopic.broadcast(`profile:${event.payment.id}`, data)
    } catch (error) {
      console.error('CONFIRMAÇÃO DE PAGAMENTO:', error)
      throw error
    }
  }
}

module.exports = Asaas
