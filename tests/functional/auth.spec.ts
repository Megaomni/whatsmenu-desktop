import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import IfoodService from '#services/ifood_integration_service'
import { ifoodMerchantToken, ifoodUserCode, userAuth } from '#tests/mocks/auth.mocks'
import { test } from '@japa/runner'
import { stub } from 'sinon'

test.group('Auth', (group) => {
  let user: User
  group.setup(async () => {
    user = await UserFactory.create()
  })
  test('Só deve ser possível gerar o código de autenticação caso o usuário esteja autenticado', async ({
    client,
  }) => {
    const response = await client.get('/ifood/userCode')
    response.assertBodyContains(userAuth)
  })
  test('Deve devolver uma exceção caso algo inesperado aconteça ao gerar o código de autenticação', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'userCode').throws()

    try {
      await client.get('/ifood/userCode').loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })
  test('Deve ser possível gerar o código de autenticação', async ({ assert, client }) => {
    const ifoodServiceStub = stub(IfoodService, 'userCode').resolves(ifoodUserCode)

    const response = await client.get('/ifood/userCode').loginAs(user)
    response.assertStatus(200)
    assert.exists(response.body().userCode)
    assert.exists(response.body().verificationUrl)
    ifoodServiceStub.restore()
  })

  test('Deve devolver uma exceção caso algo inesperado aconteça ao gerar o token', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'token').throws()

    try {
      await client.post('/ifood/token').loginAs(user)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    } finally {
      ifoodServiceStub.restore()
    }
  })

  test('Deve ser possível gerar token com código fornecido do portal ifood', async ({ client }) => {
    const ifoodServiceStub = stub(IfoodService, 'token').resolves(ifoodMerchantToken)

    const response = await client
      .post('/ifood/token')
      .json({ userCode: 'LTGG-KMGB', id: 1 })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains(ifoodMerchantToken)

    ifoodServiceStub.restore()
  })

  test('Deve retornar uma execeção caso algo inesperado aconteça ao renovar o token caso o token estiver expirado (+ 3h)', async ({
    assert,
    client,
  }) => {
    const ifoodServiceStub = stub(IfoodService, 'refreshToken').rejects()
    try {
      await client.post('/ifood/merchants').json({ id: 1 }).loginAs(user)
    } catch (error) {
      assert.isOk(error)
    } finally {
      ifoodServiceStub.restore()
    }
  })
})
