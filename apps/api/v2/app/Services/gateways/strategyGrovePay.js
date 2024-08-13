'use strict'

const axios = require('axios')
const Gateway = require('./strategy/gateway')
const { DateTime } = require('luxon')
const Env = use('Env')

class StrategyGrovePay {
  constructor() {
    this.headers = {}
  }

  setSecret(secret) {
    const includesBearerKeyword = secret.includes('Bearer')
    this.headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'authorization': `${!includesBearerKeyword || process.env.NODE_ENV === 'production' ? 'Bearer' : ''} ${secret}`,
    }
  }

  async createRecipient(data) {
    try {
      const response = await axios({
        url: `${process.env.GROVEPAY_URL}/pagarme/recipients/`,
        method: 'POST',
        data: data,
        headers: this.headers,
      })
      if (!response.data.message) return response
      console.log(response.data.message)
      throw new Error('Erro ao registrar dados bancários')
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /* async updateRecipient(data, recipientId) {
        return await axios({
            url: `${process.env.GROVEPAY_URL}/pagarme/recipients/${recipientId}`,
            method: "PATCH",
            data: data,
            headers: this.headers
        });
    } */

  async getRecipient(recipientId) {
    return await axios({
      url: `${process.env.GROVEPAY_URL}/pagarme/recipients/${recipientId}`,
      method: 'GET',
      headers: this.headers,
    })
  }

  async createCardOrder(data) {
    return await axios({
      url: `${process.env.GROVEPAY_URL}/pagarme/payment-credit-card`,
      method: 'POST',
      data: data,
      headers: this.headers,
    })
  }

  async createPixOrderSplit(data) {
    data.closed = false
    return await axios({
      url: `${process.env.GROVEPAY_URL}/pagarme/payment/pix`,
      method: 'POST',
      data: data,
      headers: this.headers,
    })
  }

  async createPixOrder(data) {
    return await axios({
      url: `${process.env.GROVEPAY_URL}/pagarme/transaction/pix/create/basic`,
      method: 'POST',
      data: data,
      headers: this.headers,
    })
  }

  async retrieveOrder(data) {
    return await axios({
      url: `${process.env.GROVEPAY_URL}/pagarme/transaction/pix/status`,
      method: 'POST',
      data: { order_id: data.order_id },
      headers: this.headers,
    })
  }

  async retrieveLoginToken() {
    const { data } = await axios({
      url: `${process.env.GROVEPAY_URL}/auth/login`,
      method: 'POST',
      data: { email: Env.get('GROVEPAY_EMAIL'), password: Env.get('GROVEPAY_PASSWORD') },
      headers: { 'content-type': 'application/json' },
    })
    return { access_token: data.access_token, created_on: DateTime.now().toUnixInteger() }
  }
}

const gatewayGrovePay = new Gateway(new StrategyGrovePay())

module.exports = gatewayGrovePay
