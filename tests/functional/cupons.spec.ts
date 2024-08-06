import User from '#models/user'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { CupomFactory } from '#database/factories/cupom_factory'
import Cupom from '#models/cupom'
import Profile from '#models/profile'

test.group('Cupons', (group) => {
  let user: User | null

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
  })

  test('Deve ser possível retornar uma lista de cupons', async ({ assert, client }) => {
    const cupons = await CupomFactory.merge({ profileId: user!.profile!.id }).createMany(3)
    const response = await client.get('/dashboard/cupons').loginAs(user!)
    response.assertStatus(200)
    assert.isArray(response.body())
    assert.equal(response.body().length, cupons.length)
  })

  test('Deve ser possível criar um novo cupom com', async ({ assert, client }) => {
    const cupomData = {
      code: 'NUUUUEVO-CODIGO',
      value: '100',
      minValue: '50',
      type: 'value',
    }
    const response = await client.post('/dashboard/cupons').loginAs(user!).json(cupomData)
    response.assertStatus(200)
    assert.isObject(response.body())
    assert.equal(response.body().code, cupomData.code)
  })

  test('Não deve ser possível criar um cupom sem fornecer [code, value, minValue, type] ', async ({
    client,
  }) => {
    const cupomData = {
      value: '100',
      minValue: '50',
    }
    const response = await client.post('/dashboard/cupons').loginAs(user!).json(cupomData)
    response.assertStatus(400)
    response.assertBody({
      message: 'Por favor, informe todos os dados do cupom!',
    })
  })

  test('Deve retornar erro ao tentar criar um cupom com código duplicado ', async ({ client }) => {
    const cupomDataFirstOnly = {
      code: 'CODIGO_DUPLICADO',
      value: '100',
      minValue: '50',
      type: 'value',
    }
    await client.post('/dashboard/cupons').loginAs(user!).json(cupomDataFirstOnly)
    const cupomDataDuplicate = {
      code: 'CODIGO_DUPLICADO',
      value: '200',
      minValue: '100',
      type: 'value',
    }
    const responseDuplicate = await client
      .post('/dashboard/cupons')
      .loginAs(user!)
      .json(cupomDataDuplicate)
    // Verifique se a resposta tem status 403 indicando que o cupom já existe
    responseDuplicate.assertStatus(403)
    responseDuplicate.assertBody({
      code: '403-42',
      message: 'this code allready exist!',
      success: false,
    })
  })

  test('Deve retornar erro ao tentar criar mais de um cupom firstOnly', async ({ client }) => {
    const cupomDataFirstOnly = {
      code: 'CODIGO_FIRST_ONLY',
      value: '100',
      minValue: '50',
      firstOnly: true,
      type: 'value',
    }
    await client.post('/dashboard/cupons').loginAs(user!).json(cupomDataFirstOnly)
    const cupomFirstOnly = {
      code: 'CODIGO_DUPLICADO_FIRST_ONLY',
      value: '200',
      minValue: '100',
      firstOnly: true,
      type: 'value',
    }
    const response = await client.post('/dashboard/cupons').loginAs(user!).json(cupomFirstOnly)
    // Verifique se a resposta indica que o cupom não pode ser criado devido à existência de um cupom firstOnly
    response.assertStatus(400)
    response.assertBody({
      code: '400-01',
      message: 'O código do cupom é inválido, pois já existe um cupom firstOnly.',
      success: false,
    })
  })

  test('Deve alterar o status playPause do cupom', async ({ client }) => {
    const cupom = await CupomFactory.merge({ profileId: user!.profile!.id }).create()
    const response = await client.patch(`/dashboard/cupons/${cupom.id}`).loginAs(user!)
    // Verificar se a resposta é bem-sucedida
    response.assertStatus(200)
    response.assertBody({
      success: true,
    })
  })

  test('Deve retornar erro ao tentar alternar o status de um cupom não encontrado', async ({
    client,
  }) => {
    const cupomId = 999
    const response = await client.patch(`/dashboard/cupons/${cupomId}`).loginAs(user!)
    // Verificar se a resposta indica que o cupom não foi encontrado
    response.assertStatus(404)
    response.assertBody({
      success: false,
      message: 'cupom not found!',
    })
  })

  test('Deve ser possivel ativar ou desativar todos os cupons', async ({ client }) => {
    const cupomSuccess = {
      code: 'CODIGO_VALIDO',
      value: '200',
      minValue: '100',
      success: true,
    }
    const response = await client.put('dashboard/cupons/feature').loginAs(user!).json(cupomSuccess)
    // Verifique se a resposta indica sucesso
    response.assertBody({
      success: true,
    })
  })

  test('Deve ser possivel excluir um cupom do banco de dados caso ele não tenha sido utilizado', async ({
    assert,
    client,
  }) => {
    const cupomData = await CupomFactory.merge({ profileId: user!.profile!.id }).create()
    const responseDelete = await client.delete(`/dashboard/cupons/${cupomData.id}`).loginAs(user!)
    responseDelete.assertStatus(200)
    responseDelete.assertBody({
      success: true,
    })

    const deletedCupom = await Cupom.find(cupomData.id)

    assert.isNull(deletedCupom)
  })

  test('Deve retornar um cupom válido ', async ({ assert, client }) => {
    const profile = await Profile.find(user!.profile.id)
    profile!.options.activeCupom = true

    await profile!.save()

    const { code } = await CupomFactory.merge({ profileId: user!.profile!.id }).create()
    const response = await client
      .get(`/api/v3/business/${user!.profile!.slug}/cupom?code=${code}`)
      .loginAs(user!)
    response.assertStatus(200)
    assert.isObject(response.body())
    assert.equal(response.body().code, code)
  })
})
