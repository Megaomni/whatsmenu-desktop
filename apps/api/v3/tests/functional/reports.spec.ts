import { ClientFactory } from '#database/factories/client_factory'
import { UserFactory } from '#database/factories/user_factory'
import Client from '#models/client'
import User from '#models/user'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Reports', (group) => {
  let user: User
  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await ClientFactory.with('carts', 5, (cart) =>
      cart.merge({
        profileId: user.profile.id,
        timeDelivery: '10',
      })
    )
      .merge({
        profileId: user.profile.id,
        created_at: DateTime.fromObject({ year: 2023 }),
      })
      .createMany(15)
  })

  test('Deve ser possível listar os 10 clientes de perfil com maior numero de pedidos', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/dashboard/reports/client/top10').loginAs(user)
    response.assertStatus(200)
    assert.lengthOf(response.body().clientsMaxQuantity, 10)
  })
  test('Deve ser possível listar os 10 clientes de perfil com maior valor gasto em pedidos', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/dashboard/reports/client/top10').loginAs(user)
    response.assertStatus(200)
    assert.lengthOf(response.body().clientsMaxTotal, 10)
  })
  test('Deve ser possível listar os 10 clientes de perfil dentro de uma data definida', async ({
    client,
    assert,
  }) => {
    await ClientFactory.merge({
      profileId: user.profile.id,
      created_at: DateTime.fromObject({ year: 2024 }),
    }).createMany(5)

    const startDate = DateTime.local().minus({ year: 1 })
    const endDate = DateTime.local()

    const response = await client
      .get(
        `/dashboard/reports/client/top10?startDate=${startDate.toFormat('yyyy-MM-dd')}&endDate=${endDate.toFormat('yyyy-MM-dd')}`
      )
      .loginAs(user)
    response.assertStatus(200)

    const {
      clientsMaxQuantity,
      clientsMaxTotal,
    }: { clientsMaxQuantity: Client[]; clientsMaxTotal: Client[] } = response.body()

    assert.isTrue(
      clientsMaxQuantity
        .flatMap((c) => c.carts)
        .every((cart) => cart.created_at >= startDate && cart.created_at <= endDate)
    )
    assert.isTrue(
      clientsMaxTotal
        .flatMap((c) => c.carts)
        .every((cart) => cart.created_at >= startDate && cart.created_at <= endDate)
    )
  })
})
