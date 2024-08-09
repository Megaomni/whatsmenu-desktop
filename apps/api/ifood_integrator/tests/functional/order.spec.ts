import { CustomerFactory } from '#database/factories/customer_factory'
import { ItemFactory } from '#database/factories/item_factory'
import { MerchantFactory } from '#database/factories/merchant_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import Customer from '#models/customer'
import Item from '#models/item'
import Merchant from '#models/merchant'
import Order from '#models/order'
import User from '#models/user'
import IfoodService from '#services/ifood_integration_service'
import { merchantTokens } from '#tests/mocks/auth.mocks'
import { ifoodOrdersMock, merchantId, wmOrdersMock } from '#tests/mocks/order.mocks'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { stub, useFakeTimers } from 'sinon'

test.group('Order', (group) => {
  let user: User
  let merchant: Merchant
  let customer: Customer
  group.setup(async () => {
    user = await UserFactory.create()
    merchant = await MerchantFactory.merge({
      merchantId,
    }).create()
    customer = await CustomerFactory.create()
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao salvar um pedido novo ou alterar um existente', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'getOrder').throws()

    try {
      await client
        .post('/ifood/polling')
        .json({ pollingData: ifoodOrdersMock.filter((order) => order.fullCode === 'PLACED') })
        .loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })
  test('Deve ser possível salvar pedidos novos via polling', async ({ client }) => {
    const { displayId, ...placedOrder } = wmOrdersMock.find(
      (order) => order.orderStatus === 'PLACED'
    ) as any
    placedOrder.merchant = merchant
    const items = await Promise.all(
      placedOrder?.itens.map(
        async ({ orderId, uniqueId, itemId, ...item }: Item) =>
          await ItemFactory.merge(item).create()
      )
    )
    placedOrder.items = items
    const ifoodServiceGetOrderStub = stub(IfoodService, 'getOrder').resolves(placedOrder)
    const ifoodServiceRefreshTokenStub = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    try {
      const response = await client
        .post('/ifood/polling')
        .json({
          pollingData: ifoodOrdersMock.filter((order) => order.fullCode === 'PLACED'),
          merchantId: merchant.merchantId,
        })
        .loginAs(user)
      response.assertStatus(200)
      response.assert?.isArray(response.body().orders)
    } catch (error) {
      throw error
    } finally {
      ifoodServiceGetOrderStub.restore()
      ifoodServiceRefreshTokenStub.restore()
    }
  })

  test('Deve ser possível verificar se um pedido pode ser cancelado', async ({ client }) => {
    const ifoodServiceStub = stub(IfoodService, 'cancellationReasons').resolves([
      {
        description: 'string',
        cancelCodeId: '501',
      },
    ])
    try {
      const order = await OrderFactory.merge({
        orderStatus: 'PLACED',
        merchantId: merchant.merchantId,
        customerId: customer.customerId,
      }).create()

      const response = await client
        .get(`/ifood/order/${order.orderId}/cancellationReasons`)
        .loginAs(user)

      response.assertStatus(200)
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Não deve ser possível verificar se um pedido inválido pode ser cancelado', async ({
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'cancellationReasons').resolves([
      {
        description: 'string',
        cancelCodeId: '501',
      },
    ])
    let response
    try {
      response = await client.get(`/ifood/order/${'id-inválido'}/cancellationReasons`).loginAs(user)
    } catch (error) {
      response?.assertStatus(404)
      response?.assertBodyContains({ message: 'Pedido não encontrado!' })
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao verificar se um pedido pode ser cancelado', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'cancellationReasons').throws()
    const order = await OrderFactory.merge({
      orderStatus: 'PLACED',
      merchantId: merchant.merchantId,
      customerId: customer.customerId,
    }).create()

    try {
      await client.get(`/ifood/order/${order.orderId}/cancellationReasons`).loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve ser possível atualizar pedidos via polling', async ({ client }) => {
    const ifoodServiceStub = stub(IfoodService, 'getOrder')
    try {
      const placedOrder = await OrderFactory.merge({
        orderStatus: 'PLACED',
        merchantId: merchant.merchantId,
        orderId: ifoodOrdersMock[0].orderId,
        customerId: customer.customerId,
      })
        .with('itens', 2)
        .with('payments', 1)
        .create()

      await placedOrder.load('itens')
      await placedOrder.load('merchant')
      await placedOrder.load('customer')

      ifoodServiceStub.resolves(placedOrder)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { created_at, updatedAt, ...expected }: Partial<Order> = {
        orderStatus: 'CONCLUDED',
        ...placedOrder.toJSON(),
      }
      const response = await client
        .post('/ifood/polling')
        .json({ pollingData: [expected] })
        .loginAs(user)
      response.assertStatus(200)
      response.assert?.isArray(response.body().orders)
      response.assert?.equal(response.body().orders[0].orderStatus, expected.orderStatus)
    } catch (error) {
      throw error
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve ser possível atualizar o status do pedido', async ({ client }) => {
    const ifoodServiceStub = stub(IfoodService, 'updateStatus')
    try {
      const order = await OrderFactory.merge({
        merchantId: merchant.merchantId,
        orderStatus: 'PLACED',
      }).create()
      const newStauts: Order['orderStatus'] = 'CONFIRMED'
      const response = await client
        .post('/ifood/order/updateStatus')
        .json({ orderId: order.orderId, status: newStauts })
        .loginAs(user)
      response.assertStatus(200)
      response.assert?.equal(response.body().order.orderStatus, newStauts)
    } catch (error) {
      throw error
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve retornoar um erro caso o pedido que vai ser atualizado não exista', async ({
    client,
  }) => {
    try {
      const newStauts: Order['orderStatus'] = 'CONFIRMED'
      const response = await client
        .post('/ifood/order/updateStatus')
        .json({ orderId: 'id-inválido', status: newStauts })
        .loginAs(user)
      response.assertStatus(404)
      response.assertBodyContains({ message: 'Order not found' })
    } catch (error) {
      throw error
    }
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao atualizar o status do pedido', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'updateStatus').throws()
    try {
      const order = await OrderFactory.merge({
        merchantId: merchant.merchantId,
        orderStatus: 'PLACED',
      }).create()
      const newStauts: Order['orderStatus'] = 'CONFIRMED'
      await client
        .post('/ifood/order/updateStatus')
        .json({ orderId: order.orderId, status: newStauts })
        .loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao listar pedidos', async ({
    assert,
    client,
  }) => {
    const queryMock = stub(Order, 'query').throws()
    try {
      await client.post('/ifood/ordersData').json({}).loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      queryMock.restore()
    }
  })

  test('Deve ser possível listar pedidos America/Sao_Paulo', async ({ client }) => {
    await OrderFactory.merge({ merchantId: merchant.merchantId }).createMany(15)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    const { preload, where, whereRaw, ...orderQueryMock } = Order.query()
    const queryMock = stub(Order, 'query').returns({
      preload: stub().returnsThis(),
      where: stub().returnsThis(),
      whereRaw: stub().returnsThis(),
      ...orderQueryMock,
    })

    try {
      const response = await client
        .post('/ifood/ordersData')
        .json({ timeZone: 'America/Sao_Paulo', id: merchant.wm_id })
        .loginAs(user)

      response.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      queryMock.restore()
      ifoodServiceStubRefreshToken.restore()
    }
  })

  test('Deve ser possível listar pedidos America/Rio_Branco', async ({ client }) => {
    await OrderFactory.merge({ merchantId: merchant.merchantId }).createMany(15)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    const { preload, where, whereRaw, ...orderQueryMock } = Order.query()
    const queryMock = stub(Order, 'query').returns({
      preload: stub().returnsThis(),
      where: stub().returnsThis(),
      whereRaw: stub().returnsThis(),
      ...orderQueryMock,
    })

    try {
      const response = await client
        .post('/ifood/ordersData')
        .json({ timeZone: 'America/Rio_Branco', id: merchant.wm_id })
        .loginAs(user)

      response.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      queryMock.restore()
      ifoodServiceStubRefreshToken.restore()
    }
  })

  test('Deve ser possível listar pedidos America/Manaus', async ({ client }) => {
    await OrderFactory.merge({ merchantId: merchant.merchantId }).createMany(15)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    const { preload, where, whereRaw, ...orderQueryMock } = Order.query()
    const queryMock = stub(Order, 'query').returns({
      preload: stub().returnsThis(),
      where: stub().returnsThis(),
      whereRaw: stub().returnsThis(),
      ...orderQueryMock,
    })

    try {
      const response = await client
        .post('/ifood/ordersData')
        .json({ timeZone: 'America/Manaus', id: merchant.wm_id })
        .loginAs(user)

      response.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      queryMock.restore()
      ifoodServiceStubRefreshToken.restore()
    }
  })

  test('Deve ser possível listar pedidos America/Noronha', async ({ client }) => {
    await OrderFactory.merge({ merchantId: merchant.merchantId }).createMany(15)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    const { preload, where, whereRaw, ...orderQueryMock } = Order.query()
    const queryMock = stub(Order, 'query').returns({
      preload: stub().returnsThis(),
      where: stub().returnsThis(),
      whereRaw: stub().returnsThis(),
      ...orderQueryMock,
    })
    try {
      const response = await client
        .post('/ifood/ordersData')
        .json({ timeZone: 'America/Noronha', id: merchant.wm_id })
        .loginAs(user)

      response.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      queryMock.restore()
    }
    ifoodServiceStubRefreshToken.restore()
  })

  test('Deve ser possível listar pedidos somente do dia em questão após as 04:00', async ({
    client,
  }) => {
    const clock = useFakeTimers(DateTime.fromObject({ hour: 3, minute: 0 }).toMillis())
    await OrderFactory.merge({ merchantId: merchant.merchantId }).createMany(15)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)
    const { preload, where, whereRaw, ...orderQueryMock } = Order.query()
    const queryMock = stub(Order, 'query').returns({
      preload: stub().returnsThis(),
      where: stub().returnsThis(),
      whereRaw: stub().returnsThis(),
      ...orderQueryMock,
    })

    try {
      const response = await client
        .post('/ifood/ordersData')
        .json({ timeZone: 'America/Sao_Paulo', id: merchant.wm_id })
        .loginAs(user)
      response.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      queryMock.restore()
      ifoodServiceStubRefreshToken.restore()
      clock.restore()
    }
  })
})
