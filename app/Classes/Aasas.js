class Customer {
  /**
   * @param {string} name
   * @param {string} cpfCnpj
   * @param {string} email
   * @param {string} mobilePhone
   * @param {string} address
   * @param {string} addressNumber
   * @param {string} province
   * @param {string} postalCode
   * @param {any[]} webhooks
   * @param {string} complement
   */
  constructor(name, cpfCnpj, email, mobilePhone, address, addressNumber, province, postalCode, webhooks = [], complement = '') {
    this.name = name
    this.cpfCnpj = cpfCnpj
    this.email = email
    this.mobilePhone = mobilePhone
    this.address = address
    this.addressNumber = addressNumber
    this.complement = complement
    this.province = province
    this.postalCode = postalCode
    this.webhooks = webhooks
  }
}

/** @typedef {{ customer: string; billingType:"BOLETO" | "CREDIT_CARD" | "PIX"; value:number; dueDate:string; description: string storeWalletID: string }} PaymentType */

class Payment {
  /**
   * @param {PaymentType} payment
   */
  constructor(payment) {
    this.customer = payment.customer
    this.billingType = payment.billingType
    this.value = payment.value
    this.dueDate = payment.dueDate
    this.description = payment.description
    this.externalReference = payment.externalReference
    this.split = payment.split
    if (payment.billingType === 'CREDIT_CARD') {
      this.creditCardToken = payment.creditCardToken
    }
  }
}

/**
 * @typedef {{
 *   walletId: string;
 *   fixedValue?: number;
 *   percentualValue?: number;
 * }} Split
 */

class Split {
  constructor(walletId, fixedValue = null, percentualValue = null) {
    this.walletId = walletId
    this.fixedValue = fixedValue
    this.percentualValue = percentualValue
  }
}

module.exports = { Split, Payment, Customer }
