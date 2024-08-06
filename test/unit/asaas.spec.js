// 'use strict'

// /** @typedef {{ name: string; cpfCnpj:string; email:string; mobilePhone:string; address:string; addressNumber:string; complement?:string; province:string; postalCode:string; webhooks?:any[] }} Customer */
// /** @typedef {{ customer: string; billingType:"BOLETO" | "CREDIT_CARD" | "PIX"; value:number; dueDate:string; split:Split[] }} Payment */
// /** @typedef {{ walletId: string; fixedValue?:number; percentualValue?:number }} Split */

// const AsaasProvider = use('AsaasProvider')
// const Env = use('Env')
// const { test } = use('Test/Suite')('Asaas')

// /** @type {string} */
// const mainAccountWalletId = '9d33213f-a89f-48ff-a35a-bdf903871f99'

// /** @type {string} */
// const subAccountWalletId = '33efe96a-3796-4feb-ae25-eca754ca73a3'

// /** @type {Customer} */
// const validCustomer = {
//   name: 'Stevie Wonder',
//   cpfCnpj: '84708722060',
//   email: 'steview@gmail.com',
//   birthDate: '1958-08-29',
//   mobilePhone: '64989874413',
//   address: 'Av. Paulista',
//   addressNumber: '150',
//   complement: 'Sala 201',
//   province: 'Centro',
//   postalCode: '01310-000',
// }

// /** @type {Customer} */
// const invalidCustomer = {
//   cpfCnpj: '00000000000',
//   email: 'marcelo.almeida@gmail.com',
//   mobilePhone: '4799376637',
//   address: 'Av. Paulista',
//   addressNumber: '150',
//   complement: 'Sala 201',
//   province: 'Centro',
//   postalCode: '01310-000',
// }

// /** @type {Payment} */
// const validPixPayment = {
//   customer: 'cus_000005678001',
//   billingType: 'PIX',
//   value: 100,
//   dueDate: '2023-10-17',
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
//   dueDate: '2023-10-17',
//   split: [{ walletId: subAccountWalletId, fixedValue: 5 }],
//   creditCardToken: cardToken.creditCardToken,
//   remoteIp: '116.213.42.532',
// }

// let pixPayment = null
// let ccPayment = null
// let pixQrCode = null
// let customerId = null

// let customerWalletId = '33efe96a-3796-4feb-ae25-eca754ca73a3'
// let customerAPIKEY =
//   'aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNjc1NDE6OiRhYWNoX2IxYTU1Mjc0LTE4ZGMtNDFkNy05Nzc4LTg1MGQ5MTBiN2ZkZA'

// test('Criar um cliente na Asaas', async ({ assert }) => {
//   const newAccount = await AsaasProvider.createCustomer(validCustomer)
//   assert.exists(newAccount.id, 'Deve criar um cliente na Asaas')
//   customerId = newAccount.id
// })

// test('Falhar em criar um cliente na Asaas', async ({ assert }) => {
//   try {
//     const newCustomer = await AsaasProvider.createCustomer(invalidCustomer)
//     assert.notExists(newCustomer.id, 'Não deve criar um cliente com CPF inválido ou sen nome')
//   } catch (error) {
//     assert.exists(error, 'Deve retornar um erro')
//   }
// })

// test('Listar clientes na Asaas', async ({ assert }) => {
//   const customers = await AsaasProvider.listCustomers()
//   assert.exists(customers.data)
// })

// test('Falhar em deletar clientes na Asaas', async ({ assert }) => {
//   try {
//     await AsaasProvider.deleteCustomer('aaaa')
//     assert.notExists(deleted, 'Não deve deletar um cliente com ID inválido')
//   } catch (error) {
//     assert.exists(error, 'Deve retornar um erro')
//   }
// })

// test('Atualizar clientes na Asaas', async ({ assert }) => {
//   const customer = await AsaasProvider.updateCustomer({ ...validCustomer, mobilePhone: '62982836480' }, customerId)
//   assert.equal(customer.mobilePhone, '62982836480', 'Deve atualizar o cliente corretamente')
// })

// test('Deletar clientes na Asaas', async ({ assert }) => {
//   const customers = await AsaasProvider.deleteCustomer(customerId)
//   assert.equal(customers.deleted, true, 'Deve deletar um cliente com ID válido')
// })

// test('Gerar array de webhooks para conta', async ({ assert }) => {
//   const webhooks = await AsaasProvider.webhooks(validCustomer.email)
//   assert.equal(webhooks.length, 4, 'Deve gerar um array de 4 webhooks')
// })

// // ESTE TESTE SO PODE SER REALIZADO 20 VEZES AO DIA, PROSSEGUIR COM CUIDADO
// /* test('Criar subconta na Asaas', async ({ assert }) => {
//   const account = await AsaasProvider.createAccount(validCustomer)
//   assert.exists(account.apiKey, 'Deve criar uma subconta na Asaas')
//   console.log(account.apiKey, account.walletId)
// }) */

// test('Listar subcontas na Asaas', async ({ assert }) => {
//   const customers = await AsaasProvider.listAccounts()
//   assert.exists(customers.data, 'Deve listar as subcontas na Asaas')
// })

// test('Criar chave pix para conta', async ({ assert }) => {
//   const key = await AsaasProvider.createPIXkey(Env.get('ASAAS_API_KEY'))
//   assert.exists(key.key, 'Deve criar uma chave pix para a conta')
// })

// test('Listar chaves pix para conta', async ({ assert }) => {
//   const key = await AsaasProvider.createPIXkey(Env.get('ASAAS_API_KEY'))
//   assert.exists(key.data, 'Deve listar as chave pix na conta')
// })

// test('Criar pagamento de pix', async ({ assert }) => {
//   const payment = await AsaasProvider.createPayment(validPixPayment)
//   pixPayment = payment.id
//   assert.exists(payment.id, 'Deve criar um pagamento de pix')
// })

// test('Criar QR Code de Pix', async ({ assert }) => {
//   const qrcode = await AsaasProvider.qrCodePix(pixPayment)
//   assert.exists(qrcode.encodedImage, 'Deve criar um QRCode de pix')
// })

// test('Criar pagamento de cartão de crédito', async ({ assert }) => {
//   const payment = await AsaasProvider.createPayment(validCCPayment)
//   ccPayment = payment.id
//   assert.exists(payment.id, 'Deve criar um pagamento de cartão de crédito')
// })
