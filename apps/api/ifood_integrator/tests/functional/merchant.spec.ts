import { MerchantFactory } from '#database/factories/merchant_factory'
import { UserFactory } from '#database/factories/user_factory'
import Merchant from '#models/merchant'
import User from '#models/user'
import IfoodService from '#services/ifood_integration_service'
import { merchantTokens } from '#tests/mocks/auth.mocks'
import { merchantsMock } from '#tests/mocks/merchant.mocks'
import { test } from '@japa/runner'
import { stub } from 'sinon'

test.group('Merchant', (group) => {
  let user: User
  group.setup(async () => {
    user = await UserFactory.create()
  })
  test('Deve devolver uma exceção caso algo inesperado aconteça ao salvar uma loja ifood', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'getMerchant').throws()

    try {
      await client.post('/ifood/merchantId').json({}).loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })
  test('Não ser possível atribuir uma loja ifood caso não tenha sido criada', async ({
    client,
  }) => {
    let response

    try {
      response = await client
        .post('/ifood/merchantId')
        .json({
          id: -1,
        })
        .loginAs(user)
    } catch (error) {
      response?.assertStatus(404)
    }
  })
  test('Deve ser possível atribuir uma loja ifood á um merchant', async ({ client }) => {
    const merchant = await MerchantFactory.create()
    const ifoodServiceStub = stub(IfoodService, 'getMerchant').resolves(merchantsMock)

    const response = await client
      .post('/ifood/merchantId')
      .json({
        id: merchant.wm_id,
        merchantId: merchantsMock[0].id,
      })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains(merchantsMock)
    ifoodServiceStub.restore()
  })
  test('Deve devolver uma exceção caso algo inesperado aconteça ao listar lojas ifood pelo wm_id', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'merchants').throws()

    try {
      await client.post('/ifood/merchants').json({}).loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })
  test('Deve ser possível listar lojas ifood de pelo wm_id', async ({ client }) => {
    const merchant = await MerchantFactory.create()
    const ifoodServiceStubMerchants = stub(IfoodService, 'merchants').resolves(merchantsMock)
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)

    try {
      const response = await client
        .post('/ifood/merchants')
        .json({
          id: merchant.wm_id,
        })
        .loginAs(user)

      response.assertStatus(200)
      response.assertBodyContains(merchantsMock)
    } catch (error) {
      throw error
    } finally {
      ifoodServiceStubMerchants.restore()
      ifoodServiceStubRefreshToken.restore()
    }
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao atribuir uma loja ifood pelo id', async ({
    assert,
    client,
  }) => {
    try {
      await client.post('/ifood/merchant').json({}).loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    }
  })
  test('Deve ser possível buscar uma loja ifood de pelo id', async ({ client }) => {
    const ifoodServiceStubRefreshToken = stub(IfoodService, 'refreshToken').resolves(merchantTokens)
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { wm_id } = await MerchantFactory.create()
      const merchant = await Merchant.findBy('wm_id', wm_id)
      const response = await client
        .post('/ifood/merchant')
        .json({
          id: wm_id,
        })
        .loginAs(user)

      response.assertStatus(200)
      response.assert?.equal(merchant!.toJSON().wm_id, response.body().wm_id)
      response.assert?.equal(merchant!.toJSON().id, response.body().id)
    } catch (error) {
      throw error
    } finally {
      ifoodServiceStubRefreshToken.restore()
    }
  })
})
