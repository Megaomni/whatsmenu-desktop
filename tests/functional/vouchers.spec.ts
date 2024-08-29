import { ClientFactory } from '#database/factories/client_factory'
import { UserFactory } from '#database/factories/user_factory'
import { VoucherFactory } from '#database/factories/voucher_factory'
import Client from '#models/client'
import User from '#models/user'
import Voucher from '#models/voucher'
import { test } from '@japa/runner'

test.group('Vouchers', (group) => {
  let user: User | null
  let clientTest: Client | null
  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user?.load('profile')
    ClientFactory
    clientTest = await ClientFactory.merge({ profileId: user?.profile.id }).create()
  })

  // group.each.setup(async () => {
  //   user = await User.create({
  //     name: 'John Doe',
  //     email: 'wq7zU@example.com',
  //     whatsapp: '11999999999',
  //     controls: {},
  //   })
  //   await user?.load('profile')
  // })

  test('Deve ser possivel alterar as configurações de cashback para o perfil ', async ({
    client,
  }) => {
    const body = {
      percentage: 30,
      expirationDate: 31,
    }
    const response = await client.patch(`/dashboard/vouchers/config`).loginAs(user!).json(body)

    await user?.load('profile')
    response.assertStatus(200)
    response.assertBody({
      message: 'Configurações de cashback atualizadas com sucesso.',
      voucher: user?.profile.options.voucher,
    })
  })

  test('Deve ser possivel ativar ou desativar o cashback', async ({ assert, client }) => {
    const response = await client.patch('/dashboard/vouchers/toggle-cashback').loginAs(user!)
    await user?.load('profile')
    response.assertStatus(200)
    response.assertBody({
      success: true,
      message: `Cashback ${user?.profile.options.voucher[0].status ? 'ativado' : 'desativado'} com sucesso.`,
    })

    response.assertBody
  })

  test('Deve ser possivel criar um novo voucher', async ({ assert, client }) => {
    const body = {
      clientId: clientTest!.id,
      profileId: user?.profile.id,
      expirationDays: 30,
      value: 100,
    }

    const { expirationDays, ...expectedResponse } = body

    const response = await client.post('/api/v3/vouchers/create').json(body)
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Voucher criado com sucesso.',
      voucher: expectedResponse,
    })
  })

  test('Não deve ser possível criar um voucher valor com valor 0', async ({ assert, client }) => {
    const body = {
      clientId: clientTest!.id,
      profileId: user?.profile.id,
      expirationDays: 30,
      value: 0,
    }

    const response = await client.post('/api/v3/vouchers/create').json(body)
    response.assertStatus(403)
    response.assertBodyContains({
      message: 'Não é possível criar um voucher zerado.',
    })
  })

  test('Não deve ser possível criar um voucher sem um client', async ({ client }) => {
    const body = {
      clientId: 0,
      profileId: user?.profile.id,
      expirationDays: 30,
      value: 20,
    }

    const response = await client.post('/api/v3/vouchers/create').json(body)
    response.assertStatus(404)
    response.assertBodyContains({
      message: 'Cliente não encontrado ou inválido.',
    })
  })

  test('Deve ser possível atualizar um voucher', async ({ assert, client }) => {
    const voucherCreated = await VoucherFactory.merge({
      profileId: user?.profile.id,
      clientId: clientTest!.id,
    }).create()

    const voucher = await Voucher.find(voucherCreated.id)

    const body = {
      expirationDays: 30,
      value: 100,
      status: 'cancelled',
    }
    const response = await client.patch(`/api/v3/vouchers/update/${voucher!.id}`).json(body)

    response.assertStatus(200)

    const { expirationDays, ...expectedResponse } = body
    assert.equal(response.body().message, 'Voucher atualizado com sucesso.')
    assert.containsSubset(response.body().voucher, {
      ...expectedResponse,
      expirationDate: voucher!.expirationDate.plus({ days: body.expirationDays }).toISO(),
    })
  })
  test('Não deve ser possível atualizar um voucher sem nenhum dado informado', async ({
    client,
  }) => {
    const voucher = await VoucherFactory.merge({
      profileId: user?.profile.id,
      clientId: clientTest!.id,
    }).create()

    const body = {}
    const response = await client.patch(`/api/v3/vouchers/update/${voucher!.id}`).json(body)

    response.assertStatus(400)
    response.assertBody({ message: 'Nenhum dado foi informado.' })
  })
  test('Não deve ser possível atualizar um voucher sem um id', async ({ client }) => {
    const body = {}
    const response = await client.patch(`/api/v3/vouchers/update/${999999999}`).json(body)

    response.assertStatus(404)
    response.assertBody({ message: 'Voucher não encontrado ou inválido.' })
  })
  test('Não deve ser possível atualizar um voucher com valor zerado', async ({ client }) => {
    const voucherCreated = await VoucherFactory.merge({
      profileId: user?.profile.id,
      clientId: clientTest!.id,
    }).create()

    const voucher = await Voucher.find(voucherCreated.id)

    const body = {
      value: 0,
    }
    const response = await client.patch(`/api/v3/vouchers/update/${voucher!.id}`).json(body)
    response.assertStatus(403)
    response.assertBody({ message: 'Não é possível criar um voucher zerado.' })
  })
})
