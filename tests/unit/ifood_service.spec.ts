import { MerchantFactory } from '#database/factories/merchant_factory'
import { UserFactory } from '#database/factories/user_factory'
import Merchant from '#models/merchant'
import User from '#models/user'
import IfoodService from '#services/ifood_integration_service'
import env from '#start/env'
import { ifoodMerchantToken } from '#tests/mocks/auth.mocks'
import { ifoodOrdersMock } from '#tests/mocks/order.mocks'
import { test } from '@japa/runner'
import sinon from 'sinon'
import { ifoodApi } from '../../app/lib/axios.js'
import { merchantTokens } from '../mocks/auth.mocks.js'
import Order from '#models/order'
import { OrderFactory } from '#database/factories/order_factory'
import { CancellationReasons } from '../../app/@types/orders.js'

test.group('Ifood', (group) => {
  let user: User
  let merchant: Merchant
  group.setup(async () => {
    user = await UserFactory.merge({
      controls: {
        ifood: {
          auth: {
            codeVerifier:
              '329xvhiznk7lm0q66ogcnn71yvjc1xs9yv467rbok4wcr2dxorfd4499sjforza2npduxb7hjyj31ube9hsnt5brwj9ur4lwjaa',
          },
        },
      },
    }).create()
    merchant = await MerchantFactory.merge({
      ...merchantTokens,
    }).create()
  })

  test('Deve ser possível solicitar o token do usuário IFood', async ({ assert }) => {
    const expected = {
      userCode: 'HGHB-XVRB',
      authorizationCodeVerifier:
        '329xvhiznk7lm0q66ogcnn71yvjc1xs9yv467rbok4wcr2dxorfd4499sjforza2npduxb7hjyj31ube9hsnt5brwj9ur4lwjaa',
      verificationUrl: 'https://portal.ifood.com.br/apps/code',
      verificationUrlComplete: 'https://portal.ifood.com.br/apps/code?c=HGHB-XVRB',
      expiresIn: 600,
    }
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').resolves({ data: expected })

    try {
      const response = await IfoodService.userCode()
      assert.deepEqual(response, expected)
      // sinon.assert.calledWithNew(ifoodApiStubPost, 'sdasdasda')
      assert.isTrue(
        ifoodApiStub.calledWith(
          `/authentication/v1.0/oauth/userCode?clientId=${env.get('IFOOD_CLIENT_ID')}`
        )
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao solicitar o token do usuário IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').throws()
    try {
      await IfoodService.userCode()
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível solicitar o token de acesso a loja IFood', async ({ assert }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').resolves({ data: ifoodMerchantToken })

    try {
      const code = 'HGHB-XVRB'
      const response = await IfoodService.token(code, user)
      assert.deepEqual(response, ifoodMerchantToken)
      const formParams = {
        clientId: env.get('IFOOD_CLIENT_ID'),
        clientSecret: env.get('IFOOD_CLIENT_SECRET'),
        authorizationCode: code,
        authorizationCodeVerifier: user?.controls.ifood?.auth?.codeVerifier,
      }

      assert.isTrue(
        ifoodApiStub.calledWith(
          `/authentication/v1.0/oauth/token`,
          { grantType: 'authorization_code', ...formParams },
          {
            headers: {
              'content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao solicitar o token de acesso a loja IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').throws()
    try {
      await IfoodService.token('HGHB-XVRB', user)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível renovar o token de acesso a loja IFood com refreshToken', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').resolves({ data: ifoodMerchantToken })

    try {
      const response = await IfoodService.refreshToken(merchant.wm_id)
      assert.deepEqual(response, ifoodMerchantToken)
      const formParams = {
        clientId: env.get('IFOOD_CLIENT_ID'),
        clientSecret: env.get('IFOOD_CLIENT_SECRET'),
        refreshToken: merchant.refresh_token,
      }

      assert.isTrue(
        ifoodApiStub.calledWith(`/authentication/v1.0/oauth/token`, {
          grantType: 'refresh_token',
          ...formParams,
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao renovar o token de acesso a loja IFood com refreshToken', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').throws()
    try {
      await IfoodService.refreshToken(merchant.wm_id)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível salvar dados vindos do polling do ifood', async ({ assert }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').resolves({ data: ifoodOrdersMock })

    try {
      const response = await IfoodService.polling(merchant.wm_id)
      assert.deepEqual(response, ifoodOrdersMock)

      assert.isTrue(
        ifoodApiStub.calledWith(`/events/v1.0/events:polling?groups=ORDER_STATUS`, {
          headers: {
            'Authorization': `Bearer ${merchant?.token}`,
            'x-polling-merchants': `${merchant?.merchantId}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao salvar dados vindos do polling do ifood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').throws()
    try {
      await IfoodService.polling(merchant.wm_id)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível listar lojas IFood', async ({ assert }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').resolves({ data: ifoodOrdersMock })

    try {
      const response = await IfoodService.merchants(merchant.wm_id)
      assert.deepEqual(response, ifoodOrdersMock)

      assert.isTrue(
        ifoodApiStub.calledWith(`merchant/v1.0/merchants`, {
          headers: {
            Authorization: `Bearer ${merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao listar lojas IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').throws()
    try {
      await IfoodService.merchants(merchant.wm_id)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível buscar uma loja IFood', async ({ assert }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').resolves({ data: ifoodOrdersMock })

    try {
      const response = await IfoodService.getMerchant(merchant, merchant.merchantId)
      assert.deepEqual(response, ifoodOrdersMock)

      assert.isTrue(
        ifoodApiStub.calledWith(`/merchant/v1.0/merchants/${merchant.merchantId}`, {
          headers: {
            Authorization: `Bearer ${merchant?.token}`,
            Accept: 'application/json',
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao buscar uma loja IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').throws()
    try {
      await IfoodService.getMerchant(merchant, merchant.merchantId)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível buscar um pedido IFood', async ({ assert }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').resolves({ data: ifoodOrdersMock })
    const token = merchant.token
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      const response = await IfoodService.getOrder(order, token!)
      assert.deepEqual(response, ifoodOrdersMock)

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao buscar um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').throws()
    try {
      await IfoodService.getOrder({} as Order, merchant.token!)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível atualizar o status (CONFIRMED) de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post')
    const body = {}
    const expected = ifoodOrdersMock.find((o) => o.fullCode === 'CONFIRMED') as any
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: expected,
      })
      await IfoodService.updateStatus(order, 'CONFIRMED')

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/confirm`, body, {
          headers: {
            Authorization: ` Bearer ${order.merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível atualizar o status (PREPARATION_STARTED) de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post')
    const body = {}
    const expected = ifoodOrdersMock.find((o) => o.fullCode === 'PREPARATION_STARTED') as any
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: expected,
      })
      await IfoodService.updateStatus(order, 'PREPARATION_STARTED')

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/startPreparation`, body, {
          headers: {
            Authorization: ` Bearer ${order.merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível atualizar o status (READ_TO_PICKUP) de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post')
    const body = {}
    const expected = ifoodOrdersMock.find((o) => o.fullCode === 'READ_TO_PICKUP') as any
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: expected,
      })
      await IfoodService.updateStatus(order, 'READ_TO_PICKUP')

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/readyToPickup`, body, {
          headers: {
            Authorization: ` Bearer ${order.merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível atualizar o status (DISPATCHED) de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post')
    const body = {}
    const expected = ifoodOrdersMock.find((o) => o.fullCode === 'DISPATCHED') as any
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: expected,
      })
      await IfoodService.updateStatus(order, 'DISPATCHED')

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/dispatch`, body, {
          headers: {
            Authorization: ` Bearer ${order.merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível atualizar o status (CANCELLED) de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post')
    const body: CancellationReasons = {
      reason: 'A loja está sem entregadores disponíveis',
      cancellationCode: '504',
    }
    const expected = ifoodOrdersMock.find((o) => o.fullCode === 'CANCELLED') as any
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: expected,
      })
      await IfoodService.updateStatus(order, 'CANCELLED', body)

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/requestCancellation`, body, {
          headers: {
            Authorization: ` Bearer ${order.merchant?.token}`,
          },
        })
      )
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao atualizar o status de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'post').throws()
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      await IfoodService.updateStatus(order, 'CONCLUDED')
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser possível solicitar o motivo de cancelamento de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get')
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      ifoodApiStub.resolves({
        data: [
          {
            description: 'string',
            cancelCodeId: '501',
          },
        ],
      })
      const response = await IfoodService.cancellationReasons(order)

      assert.isTrue(
        ifoodApiStub.calledWith(`/order/v1.0/orders/${order.orderId}/cancellationReasons`, {
          headers: {
            Authorization: `Bearer ${order?.merchant?.token}`,
          },
        })
      )
      assert.isArray(response)
    } catch (error) {
      throw error
    } finally {
      ifoodApiStub.restore()
    }
  })

  test('Deve ser retornar uma exceção caso algo inesperado aconteca ao solicitar o motivo de cancelamento de um pedido IFood', async ({
    assert,
  }) => {
    const ifoodApiStub = sinon.stub(ifoodApi, 'get').throws()
    try {
      const order = await OrderFactory.merge({ merchantId: merchant.merchantId }).create()
      await IfoodService.cancellationReasons(order)
    } catch (error) {
      assert.exists(error)
    } finally {
      ifoodApiStub.restore()
    }
  })
})
