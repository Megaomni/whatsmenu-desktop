import { test } from '@japa/runner'
import { CreateProductPayload, ProductService } from '../../app/services/product_service.js'
import Product from '#models/product'
import Complement from '#models/complement'
import Profile from '#models/profile'
import { ProfileFactory } from '#database/factories/profile_factory'
import sinon from 'sinon'
import drive from '@adonisjs/drive/services/main'
import { DateTime } from 'luxon'

test.group('Product service', (group) => {
  const productService = new ProductService()
  let profile: Profile
  let productStub: sinon.SinonStub
  let complementStub: sinon.SinonStub
  let drivePutStub: sinon.SinonStub
  let driveGetUrlStub: sinon.SinonStub

  // Simulação de dados do produto e complementos
  const data: CreateProductPayload = {
    name: 'Pizza Margherita',
    description: 'Uma deliciosa pizza de Margherita.',
    value: 50.0,
    status: true,
    order: 1,
    categoryId: 1,
    ncm_code: '12345678',
    promoteValue: 45.0,
    promoteStatus: true,
    disponibility: {
      store: { delivery: true, table: true, package: false },
      week: [], // Defina os dados da semana conforme necessário
    },
  }

  const complements = [
    {
      id: 1,
      name: 'Extra queijo',
      type: 'default',
      order: 1,
      min: 0,
      max: 3,
      required: false,
      itens: [{ name: 'Queijo Muçarela' }],
      created_at: DateTime.local(),
      updated_at: DateTime.local(),
    },
  ]

  // Configura os stubs
  async function setupStubs() {
    profile = await ProfileFactory.create()

    productStub = sinon.stub(Product, 'create').resolves({
      id: 1,
      name: data.name,
      order: data.order,
      categoryId: data.categoryId,
      description: data.description,
      value: data.value,
      status: data.status,
    } as Product)

    complementStub = sinon.stub(Product.prototype.related('complements'), 'createMany').resolves([
      {
        id: 1,
        name: 'Extra queijo',
        type: 'default',
        order: 1,
        min: 0,
        max: 3,
        required: false,
        itens: [{ name: 'Queijo Muçarela' }],
        created_at: DateTime.local(),
        updated_at: DateTime.local(),
      } as Complement,
    ])
  }

  // Configura os stubs de drive
  drivePutStub = sinon.stub(drive.use('s3'), 'put').resolves()
  driveGetUrlStub = sinon.stub(drive.use('s3'), 'getUrl').resolves('http://mock-url.com')

  group.setup(async () => {
    await setupStubs()
  })

  group.teardown(() => {
    sinon.restore()
  })

  test('Deve ser possível criar um novo produto', async ({ assert }) => {
    const result = await productService.createProduct({
      profile,
      data,
      complements,
      image: null, // Nenhuma imagem sendo passada
    })

    // Verificar se o método Product.create foi chamado com os dados corretos
    assert.isTrue(productStub.calledOnce)
    assert.isTrue(productStub.calledWith(sinon.match(data)))

    // Verificar se o método `createMany` foi chamado para os complementos
    assert.isTrue(complementStub.calledOnce)
    assert.deepEqual(result.product.complements.length, 1)

    // Verificar se o drive.put e drive.getUrl não foram chamados (já que não há imagem)
    assert.isTrue(drivePutStub.notCalled)
    assert.isTrue(driveGetUrlStub.notCalled)
  })
})
