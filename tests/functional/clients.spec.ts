import { ClientFactory } from '#database/factories/client_factory'
import { UserFactory } from '#database/factories/user_factory'
import Client from '#models/client'
import User from '#models/user'
import { test } from '@japa/runner'

test.group('Clients', (group) => {
  let user: User | null

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
  })

  test('Deve ser possível criar um novo cliente')
  test('Deve ser possível atualizar um cliente')
  test('Deve ser possível deletar um cliente')
  test('Não deve ser possiível buscar um cliente caso não seja fornecido os parametros whatsapp e profileId', async ({
    client,
  }) => {
    const params: { whatsapp?: string; profileId?: number } = {
      whatsapp: '13981243494',
    }
    let response = await client.get(
      `/api/v3/desktop/findClient?whatsapp=${params.whatsapp}&profileId=${params.profileId}`
    )

    response.assertStatus(400)
    delete params.whatsapp
    params.profileId = 4
    response = await client.get(
      `/api/v3/desktop/findClient?whatsapp=${params.whatsapp}&profileId=${params.profileId}`
    )
    response.assertStatus(400)
  })
  test('Deve ser possível buscar um cliente ', async ({ client: apiClient, assert }) => {
    const client = await ClientFactory.merge({ profileId: user!.profile.id }).create()
    const response = await apiClient.get(
      `/api/v3/desktop/findClient?whatsapp=${client.whatsapp}&profileId=${user!.profile.id}`
    )

    response.assertStatus(200)
    assert.equal(response.body().client.whatsapp, client.whatsapp)
    assert.equal(response.body().client.profileId, user!.profile.id)
    assert.isArray(response.body().client.vouchers)
  })

  test('Deve ser possível marcar todos os vouchers de um cliente como usados', async ({
    client: apiClient,
    assert,
  }) => {
    const client = await ClientFactory.merge({ profileId: user!.profile.id }).create()
    const response = await apiClient.patch(`/api/v3/clients/${client.id}/updateVouchers`)
    response.assertStatus(200)

    const clientUpdated = await Client.find(client.id)
    await clientUpdated?.load('vouchers')
    assert.equal(clientUpdated?.vouchers.length, 0)
  })
})
