import { test } from '@japa/runner'
import IfoodIntegrationService from '#services/ifood_integration_service'
import sinon from 'sinon'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { ifoodApi } from '#lib/axios'
import Profile from '#models/profile'

test.group('Ifood integration', (group) => {
  let user: User
  let ifoodService: IfoodIntegrationService

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user?.load('profile')

    ifoodService = new IfoodIntegrationService()
  })

  // MÉTODO USERCODE
  test('userCode: Deve ser possível fazer uma solicitação GET para /userCode e retornar o código do usuário', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'userCode').resolves({
      data: {
        code: 'CODIGO_VALIDO',
      },
    })
    try {
      const response = await client.get('/dashboard/ifood/userCode').loginAs(user!)

      response.assertStatus(200)
      assert.isObject(response.body())
      sinon.assert.calledWith(serviceStub)
    } finally {
      serviceStub.restore()
    }
  })

  test('userCode: Deve retornar os dados de resposta quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const data = { data: { code: 'CODIGO_VALIDO' } }
    const serviceStub = sinon.stub(ifoodApi, 'get').resolves({ data })

    const service = new IfoodIntegrationService()
    try {
      const response = await service.userCode()

      assert.deepEqual(response, data)
      sinon.assert.calledOnceWithExactly(serviceStub, '/ifood/userCode')
    } finally {
      serviceStub.restore()
    }
  })

  test('userCode: Deve retornar ERROR quando não recuperar o código do usuário da API do iFood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'userCode').throws()

    try {
      await client.get('/dashboard/ifood/userCode').loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('userCode: Deve lançar um ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'get').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.userCode()
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO TOKEN
  test('token: Deve ser possível fazer uma solicitação POST para /token e retornar o Token do comerciante', async ({
    assert,
    client,
  }) => {
    const code = 'authCode'
    const profile = user?.profile

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'token')
      .resolves([{ id: 'merchantId' }])
    try {
      const response = await client
        .post('/dashboard/ifood/token')
        .json({ code, profile })
        .loginAs(user!)

      response.assertStatus(200)
      assert.isObject(response.body())
      response.assertBody({
        merchants: [
          {
            id: 'merchantId',
          },
        ],
      })
      sinon.assert.calledWith(serviceStub)
    } finally {
      serviceStub.restore()
    }
  })

  test('token: Deve retornar os comerciantes quando as solicitações forem bem-sucedidas', async ({
    assert,
  }) => {
    const code = 'authCode'
    const profile = { id: 1, timeZone: 'GMT' } as Profile

    const tokenData = { data: true }
    const merchantsData = { data: [{ id: 'merchantId' }] }
    const merchantIdData = { data: { id: 'merchantId' } }
    const serviceStub = sinon.stub(ifoodApi, 'post')

    serviceStub.withArgs('/ifood/token').resolves({ data: tokenData })
    serviceStub.withArgs('/ifood/merchants').resolves(merchantsData)
    serviceStub.withArgs('/ifood/merchantId').resolves(merchantIdData)
    try {
      const response = await ifoodService.token(code, profile)

      assert.deepEqual(response, merchantsData.data)
      sinon.assert.calledWith(serviceStub, '/ifood/token', { code, id: profile.id })
      sinon.assert.calledWith(serviceStub, '/ifood/merchants', {
        timeZone: profile.timeZone,
        id: profile.id,
      })
      sinon.assert.calledWith(serviceStub, '/ifood/merchantId', {
        merchantId: 'merchantId',
        id: profile.id,
      })
    } finally {
      serviceStub.restore()
    }
  })

  test('token: Deve retornar ERROR quando não recuperar o token e dados de comerciantes da API do ifood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'token').throws()

    try {
      await client.post('/dashboard/ifood/token').loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('token: Deve lançar um ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.token('authCode', user!.profile)
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO POLLING
  test('polling: Deve ser possível fazer uma solicitação POST para /polling e retornar novos pedidos', async ({
    assert,
    client,
  }) => {
    const pollingData = [{ someKey: 'someValue' }]
    const token = 'token'
    const eventsPolling = {
      orders: [
        { orderStatus: 'PLACED', orderId: 'order1' },
        { orderStatus: 'CANCELLED', orderId: 'order2' },
      ],
      merchant: {},
    }
    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'polling')
      .resolves(eventsPolling)

    try {
      const response = await client
        .post('api/v3/desktop/ifood/polling')
        .json({ pollingData, token })
        .loginAs(user!)

      response.assertStatus(200)
      assert.isObject(response.body())
      assert.deepEqual(response.body(), eventsPolling)
      sinon.assert.calledOnceWithExactly(serviceStub, { pollingData, token })
    } finally {
      serviceStub.restore()
    }
  })

  test('polling: Deve retornar eventos de pedidos quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const pollingData = [{ someKey: 'someValue' }]
    const token = 'token'
    const data = { orders: [{ orderStatus: 'PLACED' }, { orderStatus: 'CANCELLED' }], merchant: {} }
    const serviceStub = sinon.stub(ifoodApi, 'post').resolves({ data })

    const service = new IfoodIntegrationService()
    try {
      const response = await service.polling({ token, pollingData })

      assert.deepEqual(response, data)
      sinon.assert.calledOnceWithExactly(serviceStub, `/ifood/polling`, { token, pollingData })
    } finally {
      serviceStub.restore()
    }
  })

  test('polling: Deve retornar ERROR quando não recuperar eventos de pedidos da API do iFood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'polling').throws()

    try {
      await client
        .post('api/v3/desktop/ifood/polling')
        .json({ pollingData: [{ someKey: 'someValue' }], id: 1 })
        .loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('polling: Deve lançar um ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.polling({ token: 'token', pollingData: [{ someKey: 'someValue' }] })
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO MERCHANTS
  test('merchants: Deve ser possível fazer uma solicitação GET para /merchants e retornar os comerciantes', async ({
    assert,
    client,
  }) => {
    const profile = user.profile
    const merchantsData = { merchants: [{ id: 'merchant1', name: 'Merchant 1' }] }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'merchants')
      .resolves(merchantsData)

    try {
      const response = await client
        .get('/dashboard/ifood/merchants')
        .json({ profile, merchantsData })
        .loginAs(user!)

      response.assertStatus(200)
      assert.deepEqual(response.body(), merchantsData)
      sinon.assert.calledOnceWithExactly(serviceStub, profile.id)
    } finally {
      serviceStub.restore()
    }
  })

  test('merchants: Deve retornar comerciantes quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const profile = user?.profile
    const id = profile.id
    const data = { merchants: [{ id: 'merchant1', name: 'Merchant 1' }] }
    const serviceStube = sinon.stub(ifoodApi, 'get').resolves({ data })

    const service = new IfoodIntegrationService()
    try {
      const response = await service.merchants(id)

      assert.deepEqual(response, data)
      sinon.assert.calledOnceWithExactly(serviceStube, `/ifood/merchants/${id}`)
    } finally {
      serviceStube.restore()
    }
  })

  test('merchants: Deve retornar ERROR quando não recuperar comerciantes da API do iFood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'merchants').throws()

    try {
      await client.get('/dashboard/ifood/merchants').loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('merchants: Deve lançar um ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'get').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.merchants(1)
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO MERCHANTID
  test('merchantId: Deve ser possível fazer uma solicitação POST para /merchantId e retornar os comerciantes', async ({
    assert,
    client,
  }) => {
    const profile = user.profile
    const merchantId = 'merchant1'
    const expectedData = { merchantId: 'merchant1', name: 'Merchant 1' }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'merchantId')
      .resolves(expectedData)
    try {
      const response = await client
        .post('/dashboard/ifood/merchantId')
        .json({ merchantId })
        .loginAs(user!)

      response.assertStatus(200)
      assert.deepEqual(response.body(), expectedData)
      assert.isTrue(serviceStub.calledOnce)
      const [calledMerchantId, calledProfile] = serviceStub.firstCall.args

      assert.equal(calledMerchantId, merchantId)
      assert.instanceOf(calledProfile, Profile)
      assert.equal(calledProfile.id, profile.id)
    } finally {
      serviceStub.restore()
    }
  })

  test('merchantId: Deve retornar comerciantes quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const profile = user.profile
    const merchantId = 'merchant1'
    const expectedData = { merchantId: 'merchant1', name: 'Merchant 1' }

    const serviceStub = sinon.stub(ifoodApi, 'post').resolves({ data: expectedData })
    const service = new IfoodIntegrationService()

    try {
      const response = await service.merchantId(merchantId, profile)

      assert.deepEqual(response, expectedData)
      sinon.assert.calledOnceWithExactly(serviceStub, `/ifood/merchantId`, {
        id: profile.id,
        merchantId: merchantId,
      })
    } finally {
      serviceStub.restore()
    }
  })

  test('merchantId: Deve retornar ERROR quando não recuperar comerciantes da API do iFood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'merchantId').throws()

    try {
      await client.post('/dashboard/ifood/merchantId').loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('merchantId: Deve retornar ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.merchantId('merchant1', user.profile!)
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO GETMERCHANT
  test('getMerchant: Deve ser possível fazer uma solicitação GET para /getMerchant e retornar os comerciantes', async ({
    assert,
    client,
  }) => {
    const profileStub = sinon.stub(Profile, 'findBy').resolves({
      id: user.profile.id,
      timeZone: user.profile.timeZone,
    } as Profile)
    const merchantData = { id: 1, name: 'Merchant 1' }
    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'getMerchant')
      .resolves({ data: merchantData })
    try {
      const response = await client
        .get('api/v3/desktop/ifood/merchant')
        .json({ slug: user.profile.slug })
        .loginAs(user!)

      response.assertStatus(200)
      assert.deepEqual(response.body(), { data: merchantData })
      sinon.assert.calledOnceWithExactly(serviceStub, user.profile.id, user.profile.timeZone)
    } finally {
      profileStub.restore()
      serviceStub.restore()
    }
  })

  test('getMerchant: Deve retornar comerciantes quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const wmId = user.profile.id
    const timeZone = user.profile.timeZone
    const merchantData = { id: 1, name: 'Merchant 1' }

    const serviceStub = sinon.stub(ifoodApi, 'post').resolves({ data: merchantData })
    const service = new IfoodIntegrationService()
    try {
      const response = await service.getMerchant(wmId, timeZone)

      assert.deepEqual(response, merchantData)
      sinon.assert.calledOnceWithExactly(serviceStub, '/ifood/merchant', { id: wmId, timeZone })
    } finally {
      serviceStub.restore()
    }
  })

  test('getMerchant: Deve retornar ERROR quando não recuperar comerciantes da API do iFood', async ({
    assert,
    client,
  }) => {
    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'getMerchant').throws()

    try {
      await client.post('api/v3/desktop/ifood/merchant').json({ slug: 'magrin' }).loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('getMerchant: Deve retornar ERROR quando a solicitação falhar', async ({ assert }) => {
    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.getMerchant(1, 'America/Sao_Paulo')
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO CANCELLATION REASONS
  test('cancellationReasons: Deve ser possível fazer uma solicitação GET para /cancellationReasons e retornar as razões de cancelamento', async ({
    assert,
    client,
  }) => {
    const orderId = 'test_order_id'
    const expectedResponse = {
      reasons: ['Reason 1', 'Reason 2'],
    }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'cancellationReasons')
      .resolves(expectedResponse)
    try {
      const response = await client
        .get(`dashboard/ifood/order/${orderId}/cancellationReasons`)
        .json({ orderId })
        .loginAs(user!)

      response.assertStatus(200)
      assert.deepEqual(response.body(), expectedResponse)
      sinon.assert.calledOnceWithExactly(serviceStub, orderId)
    } finally {
      serviceStub.restore()
    }
  })

  test('cancellationReasons: Deve retornar razões de cancelamento quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const orderId = 'test_order_id'
    const expectedResponse = { reasons: ['Reason 1', 'Reason 2'] }

    const serviceStub = sinon.stub(ifoodApi, 'get').resolves({ data: expectedResponse })
    const service = new IfoodIntegrationService()

    try {
      const result = await service.cancellationReasons(orderId)

      assert.deepEqual(result, expectedResponse)
      sinon.assert.calledOnceWithExactly(serviceStub, `/ifood/order/${orderId}/cancellationReasons`)
    } finally {
      serviceStub.restore()
    }
  })

  test('cancellationReasons: Deve retornar ERROR quando não recuperar razões de cancelamento da API do iFood', async ({
    assert,
    client,
  }) => {
    const orderId = { orderId: 'test_order_id' }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'cancellationReasons')
      .throws()
    try {
      await client
        .get(`dashboard/ifood/order/${orderId}/cancellationReasons`)
        .json({ orderId })
        .loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('cancellationReasons: Deve retornar ERROR quando a solicitação falhar', async ({
    assert,
  }) => {
    const orderId = 'test_order_id'

    const serviceStub = sinon.stub(ifoodApi, 'get').throws(new Error('Simulated error'))
    const service = new IfoodIntegrationService()

    try {
      await service.cancellationReasons(orderId)
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO GET ORDERS
  test('getOrders: Deve ser possível fazer uma solicitação GET para /orders e retornar os pedidos', async ({
    assert,
    client,
  }) => {
    const expectedResponse = {
      orders: [{ id: user.profile.id, name: 'Order 1' }],
    }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'getOrdersData')
      .resolves(expectedResponse)

    try {
      const response = await client
        .get('dashboard/ifood/ordersData')
        .json({ expectedResponse })
        .loginAs(user!)

      response.assertStatus(200)
      assert.deepEqual(response.body(), expectedResponse)
      sinon.assert.calledOnce(serviceStub)
    } finally {
      serviceStub.restore()
    }
  })

  test('getOrders: Deve retornar pedidos quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const profile = { id: user.profile.id, timeZone: user.profile.timeZone } as Profile
    const expectedResponse = { orders: [{ id: profile.id, timeZone: profile.timeZone }] }

    const serviceStub = sinon.stub(ifoodApi, 'post').resolves({ data: expectedResponse })
    const service = new IfoodIntegrationService()
    try {
      const result = await service.getOrdersData(profile)

      assert.deepEqual(result, expectedResponse)
      sinon.assert.calledOnceWithExactly(serviceStub, '/ifood/ordersData', {
        id: profile.id,
        timeZone: profile.timeZone,
      })
    } finally {
      serviceStub.restore()
    }
  })

  test('getOrders: Deve retornar ERROR quando não recuperar pedidos da API do iFood', async ({
    assert,
    client,
  }) => {
    const expectedResponse = { orders: [{ id: user.profile.id, timeZone: user.profile.timeZone }] }

    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'getOrdersData').throws()
    try {
      await client.post('dashboard/ifood/ordersData').json({ expectedResponse }).loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('getOrders: Deve retornar ERROR quando a solicitação falhar', async ({ assert }) => {
    const profile = { id: user.profile.id, timeZone: user.profile.timeZone } as Profile
    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.getOrdersData(profile)
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })

  // MÉTODO UPDATE STATUS
  test('updateStatus: Deve ser possível fazer uma solicitação POST para /orders e atualizar o status do pedido', async ({
    assert,
    client,
  }) => {
    const orderId = '12345'
    const status = 'DISPATCHED'
    const cancellationReason = 'Motivo do cancelamento'
    const expectedResponse = { message: 'Status updated successfully' }

    const serviceStub = sinon
      .stub(IfoodIntegrationService.prototype, 'updateStatus')
      .resolves(expectedResponse)

    const response = await client
      .post(`dashboard/ifood/order/${orderId}/updateStatus`)
      .json({ status, cancellationReason })
      .loginAs(user!)

    assert.equal(response.status(), 200)
    assert.deepEqual(response.body(), expectedResponse)
    sinon.assert.calledOnceWithExactly(serviceStub, { status, cancellationReason, orderId })
    serviceStub.restore()
  })

  test('updateStatus: Deve retornar pedidos quando a solicitação for bem-sucedida', async ({
    assert,
  }) => {
    const orderId = '12345'
    const status = 'DISPATCHED'
    const expectedResponse = { message: 'Status updated successfully' }

    const serviceStub = sinon.stub(ifoodApi, 'post').resolves({ data: expectedResponse })
    const service = new IfoodIntegrationService()
    try {
      const result = await service.updateStatus({ status, orderId, cancellationReason: '' })

      assert.deepEqual(result, expectedResponse)
      sinon.assert.calledOnceWithExactly(serviceStub, `/ifood/order/updateStatus`, {
        orderId,
        status,
        cancellationReason: '',
      })
    } finally {
      serviceStub.restore()
    }
  })

  test('updateStatus: Deve retornar ERROR quando não atualizar o status do pedido', async ({
    assert,
    client,
  }) => {
    const orderId = '12345'
    const status = 'DISPATCHED'

    const serviceStub = sinon.stub(IfoodIntegrationService.prototype, 'updateStatus').throws()
    try {
      await client
        .post(`dashboard/ifood/order/${orderId}/updadeStatus`)
        .json({ orderId, status })
        .loginAs(user!)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      serviceStub.restore()
    }
  })

  test('updateStatus: Deve retornar ERROR quando a solicitação falhar', async ({ assert }) => {
    const orderId = '12345'
    const status = 'DISPATCHED'

    const serviceStub = sinon.stub(ifoodApi, 'post').throws(new Error('Simulated error'))

    const service = new IfoodIntegrationService()
    try {
      await service.updateStatus({ status, orderId, cancellationReason: '' })
    } catch (error) {
      assert.equal(error.message, 'Simulated error')
    }
    sinon.assert.calledOnce(serviceStub)
    serviceStub.restore()
  })
})
