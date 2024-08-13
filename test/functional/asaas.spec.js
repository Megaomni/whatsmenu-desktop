// 'use strict'

// const { test } = use('Test/Suite')('Asaas Functional')
// const AsaasProvider = use('AsaasProvider')
// const Env = use('Env')

// /** @typedef {{ name: string; cpfCnpj:string; email:string; mobilePhone:string; address:string; addressNumber:string; complement?:string; province:string; postalCode:string; webhooks?:any[] }} Customer */
// /** @typedef {{ customer: string; billingType:"BOLETO" | "CREDIT_CARD" | "PIX"; value:number; dueDate:string; split:Split[] }} Payment */
// /** @typedef {{ walletId: string; fixedValue?:number; percentualValue?:number }} Split */

// /** @type {string} */
// const mainAccountWalletId = '9d33213f-a89f-48ff-a35a-bdf903871f99'
// /** @type {string} */
// const subAccountWalletId = '33efe96a-3796-4feb-ae25-eca754ca73a3'

// /** @type {number} */
// const pixValue = 100

// /** @type {Payment} */
// const validPixPayment = {
//   customer: 'cus_000005678007',
//   billingType: 'PIX',
//   value: 100,
//   dueDate: '2023-10-19',
//   split: [{ walletId: subAccountWalletId, fixedValue: 5 }],
// }

// const cardToken = {
//   creditCardNumber: '8829',
//   creditCardBrand: 'MASTERCARD',
//   creditCardToken: '1e02e66a-fcdc-4acb-a395-e88957fc1df0',
// }

// /** @type {Payment} */
// const validCCPayment = {
//   customer: 'cus_000005678001',
//   billingType: 'CREDIT_CARD',
//   value: 100,
//   dueDate: '2023-10-18',
//   split: [{ walletId: subAccountWalletId, fixedValue: 5 }],
//   creditCardToken: cardToken.creditCardToken,
//   remoteIp: '116.213.42.532',
// }

// /** @type {string} */
// const customerAPIKEY =
//   'aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNjc1NDE6OiRhYWNoX2IxYTU1Mjc0LTE4ZGMtNDFkNy05Nzc4LTg1MGQ5MTBiN2ZkZA'

// test('Gerar cobrança PIX e retornar QR Code e Copia e Cola', async ({ assert }) => {
//   const payment = await AsaasProvider.createPayment(validPixPayment)
//   const qrCode = await AsaasProvider.qrCodePix(payment.id)
//   assert.exists(qrCode.encodedImage, 'Deve criar um QRCode de pix')
// })
