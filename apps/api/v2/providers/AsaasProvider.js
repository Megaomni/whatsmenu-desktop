'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

/** @typedef {{ path: string; method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH"; data?:any }} AsaasRequest */
/** @typedef {{ name: string; cpfCnpj:string; email:string; mobilePhone:string; address:string; addressNumber:string; complement?:string; province:string; postalCode:string; webhooks?:any[] }} Customer */
/** @typedef {{ customer: string; billingType:"BOLETO" | "CREDIT_CARD" | "PIX"; value:number; dueDate:string; split:Split[] }} Payment */
/** @typedef {{ walletId: string; fixedValue?:number; percentualValue?:number }} Split */

class AsaasProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   * @function register
   * @returns {void}
   */
  register() {
    const axios = require('axios')
    const Env = use('Env')
    const Ws = use('Ws')

    /**
     * Função para construir a request na API da ASAAS.
     * @param {AsaasRequest} param
     */
    async function asaasRequest({ path, method = 'GET', params, data, token }) {
      try {
        const { data: response } = await axios({
          method,
          url: new URL(path, Env.get('ASAAS_API_URL')).href,
          data,
          params,
          headers: {
            access_token: `$${token || Env.get('ASAAS_API_KEY')}==`,
          },
        })
        return response
      } catch (error) {
        console.log(error)
        throw error.response.data.errors.map((err) => err.description).join(', ')
      }
    }

    /**
     * Função para popular os WebHooks.
     * @param {string} email
     */
    /* function webhooks(email) {
      const webHookTypes = [
        { type: 'ACCOUNT_STATUS', slug: 'accounts' },
        { type: 'TRANSFER', slug: 'transfers' },
        { type: 'PAYMENT', slug: 'payments' },
        { type: 'INVOICE', slug: 'invoices' },
      ]
      return webHookTypes.map((type) => ({
        url: `${Env.get('HOST')}/asaas/${type.slug}`,
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
    async function createCustomer(body) {
      try {
        return await asaasRequest({ path: 'customers', method: 'POST', data: body })
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
    async function listCustomers(filter, parameter, offset, limit) {
      try {
        return await asaasRequest({ path: `customers/`, params: filter ? { [filter]: parameter, offset, limit } : null, method: 'GET' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para obter informações de um cliente.
     * @param {string} customerId
     */
    async function findCustomer(customerId) {
      try {
        return await asaasRequest({ path: `customers/${customerId}`, method: 'GET' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para atualizar um cliente.
     * @param {Customer} body
     * @param {string} customerId
     */
    async function updateCustomer(body, customerId) {
      try {
        return await asaasRequest({ path: `customers/${customerId}`, method: 'POST', data: body })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para deletar um cliente.
     * @param {string} customerId
     */
    async function deleteCustomer(customerId) {
      try {
        return await asaasRequest({ path: `customers/${customerId}`, method: 'DELETE' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para restaurar um cliente removido.
     * @param {string} customerId
     */
    async function restoreCustomer(customerId) {
      try {
        return await asaasRequest({ path: `customers/${customerId}/restore`, method: 'GET' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para criar uma subconta.
     * @param {Customer} body
     */
    async function createAccount(body) {
      try {
        return await asaasRequest({ path: 'accounts', method: 'POST', data: { ...body, webhooks: webhooks(body.email) } })
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
    async function listAccounts(filter, parameter, offset, limit) {
      try {
        return await asaasRequest({ path: `accounts/`, params: filter ? { [filter]: parameter, offset, limit } : null, method: 'GET' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para obter informações de uma subconta.
     * @param {string} id
     */
    async function findAccount(id) {
      try {
        return await asaasRequest({ path: `accounts/?id=${id}`, method: 'GET' })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para criar uma chave PIX para a conta.
     * @param {string} accessToken
     */
    async function createPIXkey(accessToken) {
      try {
        return await asaasRequest({ path: `pix/addressKeys`, method: 'POST', token: accessToken, data: { type: 'EVP' } })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para listar todas as chaves pix de uma conta.
     * @param {string} accessToken
     */
    async function listPIXKeys(accessToken) {
      try {
        return await asaasRequest({ path: `pix/addressKeys`, method: 'GET', token: accessToken })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para criar um pagamento individual.
     * @param {Payment} body
     */
    async function createPayment(body) {
      try {
        return await asaasRequest({ path: 'payments', method: 'POST', data: body })
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para gerar qrCode de uma cobrança PIX.
     * @param {string} paymentId
     */
    async function qrCodePix(paymentId) {
      try {
        const qrCode = await asaasRequest({ path: `payments/${paymentId}/pixQrCode`, method: 'GET' })
        return qrCode
      } catch (error) {
        throw error
      }
    }

    /**
     * Função para ler o saldo da conta.
     * @param {string} accessToken
     */
    async function verifyAccountBalance(accessToken) {
      try {
        return await asaasRequest({ path: `finance/balance`, method: 'GET', token: accessToken })
      } catch (error) {
        throw error
      }
    }

    /** WEBHOOKS **/

    function webHookHandler(event) {
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
            break
          case 'PAYMENT_RECEIVED':
            paymentReceivedWebhook(event)
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
    }

    async function paymentReceivedWebhook(event) {
      try {
        console.log(`profile:${event.payment.id}`)
        const orderTopic = Ws.getChannel('profile:*').topic(`profile:${event.payment.id}`)
        await CartController.changeOrderPaymentStatus(event.payment.id, 'paid')
        orderTopic.broadcast(`profile:${event.payment.id}`, { paid: true })
      } catch (error) {
        console.log(error)
      }
    }

    this.app.singleton('AsaasProvider', () => {
      return {
        createCustomer,
        listCustomers,
        findCustomer,
        updateCustomer,
        deleteCustomer,
        restoreCustomer,
        createPayment,
        createAccount,
        findAccount,
        listAccounts,
        createPIXkey,
        listPIXKeys,
        qrCodePix,
        verifyAccountBalance,
        webHookHandler,
      }
    })
  }

  /**
   * Attach context getter when all providers have
   * been registered
   * @function boot
   * @returns {void}
   */
  boot() {
    //
  }
}

module.exports = AsaasProvider
