import { test } from '@japa/runner'
import sinon from 'sinon'
import { ProductService } from '../../app/services/product_service.js'
import Profile from '#models/profile'
import { UserFactory } from '#database/factories/user_factory'
import Category from '#models/category'
import User from '#models/user'
import Complement from '#models/complement'
import { ComplementItem } from '#interfaces/complement'
import Product from '#models/product'

test.group('Product service', (group) => {
  const productService = new ProductService()
  let user: User
  let profile: Profile

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user.load('profile')
    profile = user.profile
  })

  group.teardown(() => {
    sinon.restore()
  })

  // Create Product
  test('Deve ser possível criar um novo produto', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })
    const body = {
      complements: [],
      data: {
        amount: 1,
        countRequests: 0,
        order: 1,
        bypass_amount: false,
        amount_alert: 0,
        description: 'Teste',
        name: 'Teste',
        disponibility: {
          store: {
            delivery: true,
            table: true,
            package: true,
          },
          week: {
            sunday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 7,
                active: true,
              },
            ],
            monday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 1,
                active: true,
              },
            ],
            tuesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 2,
                active: true,
              },
            ],
            wednesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 3,
                active: true,
              },
            ],
            thursday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 4,
                active: true,
              },
            ],
            friday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 5,
                active: true,
              },
            ],
            saturday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 6,
                active: true,
              },
            ],
          },
        },
        promoteValue: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        promoteValueTable: 0,
        valueTable: 0,
        value: 0,
        status: true,
        categoryId: category.id,
      },
      profile,
    }

    try {
      const response = await productService.createProduct(body as any)
      assert.exists(response.product)
      assert.equal(response.product.name, 'Teste')
      assert.equal(response.product.description, 'Teste')
      assert.equal(response.product.categoryId, category.id)
      assert.deepEqual(response.product.disponibility, body.data.disponibility)
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível criar complementos novos junto com o produto', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })
    const newComplement = {
      name: 'Novo complemento',
      itens: [
        {
          name: 'Item 1',
        },
      ],
    }
    const body = {
      complements: [newComplement],
      data: {
        amount: 1,
        countRequests: 0,
        order: 1,
        bypass_amount: false,
        amount_alert: 0,
        description: 'Teste',
        name: 'Teste',
        disponibility: {
          store: {
            delivery: true,
            table: true,
            package: true,
          },
          week: {
            sunday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 7,
                active: true,
              },
            ],
            monday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 1,
                active: true,
              },
            ],
            tuesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 2,
                active: true,
              },
            ],
            wednesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 3,
                active: true,
              },
            ],
            thursday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 4,
                active: true,
              },
            ],
            friday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 5,
                active: true,
              },
            ],
            saturday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 6,
                active: true,
              },
            ],
          },
        },
        promoteValue: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        promoteValueTable: 0,
        valueTable: 0,
        value: 0,
        status: true,
        categoryId: category.id,
      },
    }

    try {
      const response = await productService.createProduct(body as any)
      assert.exists(response.product.complements)
      assert.lengthOf(response.product.complements, 1)
      assert.equal(response.product.complements[0].name, newComplement.name)
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível vincular complementos já existentes a um novo produto', async ({
    assert,
  }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const existingComplement = await Complement.create({
      name: 'Complemento existente',
      itens: [
        {
          name: 'Item 1',
          code: '123456',
        },
      ] as ComplementItem[],
    })
    const body = {
      complements: [
        {
          name: 'Complemento existente',
          id: existingComplement.id,
        },
      ],
      data: {
        amount: 1,
        countRequests: 0,
        order: 1,
        bypass_amount: false,
        amount_alert: 0,
        description: 'Teste',
        name: 'Teste Produto',
        disponibility: {
          store: {
            delivery: true,
            table: true,
            package: true,
          },
          week: {
            sunday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 7,
                active: true,
              },
            ],
            monday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 1,
                active: true,
              },
            ],
            tuesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 2,
                active: true,
              },
            ],
            wednesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 3,
                active: true,
              },
            ],
            thursday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 4,
                active: true,
              },
            ],
            friday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 5,
                active: true,
              },
            ],
            saturday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 6,
                active: true,
              },
            ],
          },
        },
        promoteValue: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        promoteValueTable: 0,
        valueTable: 0,
        value: 0,
        status: true,
        categoryId: category.id,
      },
    }
    try {
      const response = await productService.createProduct(body as any)

      // Verificando se o produto foi criado com o complemento existente vinculado
      assert.exists(response.product)
      assert.equal(response.product.name, 'Teste Produto')
      assert.lengthOf(response.product.complements, 1)
      assert.equal(response.product.complements[0].id, existingComplement.id)
      assert.equal(response.product.complements[0].name, 'Complemento existente')
    } catch (error) {
      throw error
    }
  })

  test('Deve lançar um erro ao tentar criar um produto com categoria inexistente', async ({
    assert,
  }) => {
    await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const body = {
      complements: [],
      data: {
        amount: 1,
        countRequests: 0,
        order: 1,
        bypass_amount: false,
        amount_alert: 0,
        description: 'Teste',
        name: 'Teste',
        disponibility: {
          store: {
            delivery: true,
            table: true,
            package: true,
          },
          week: {
            sunday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 7,
                active: true,
              },
            ],
            monday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 1,
                active: true,
              },
            ],
            tuesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 2,
                active: true,
              },
            ],
            wednesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 3,
                active: true,
              },
            ],
            thursday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 4,
                active: true,
              },
            ],
            friday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 5,
                active: true,
              },
            ],
            saturday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 6,
                active: true,
              },
            ],
          },
        },
        promoteValue: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        promoteValueTable: 0,
        valueTable: 0,
        value: 0,
        status: true,
        categoryId: 99999,
      },
      profile,
    }

    try {
      await productService.createProduct(body as any)
    } catch (error) {
      assert.exists(error)
    }
  })

  // Update Product
  test('Deve ser possível atualizar um produto', async ({ assert, client }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const product = await Product.create({
      name: 'Teste',
      description: 'Teste',
      order: 1,
      value: 0,
      valueTable: 0,
      categoryId: category.id,
    })

    const body = {
      complements: [],
      data: {
        amount: 1,
        countRequests: 0,
        order: 1,
        bypass_amount: false,
        amount_alert: 0,
        description: 'Atualizado',
        name: 'Atualizado',
        disponibility: {
          store: {
            delivery: true,
            table: true,
            package: true,
          },
          week: {
            sunday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 7,
                active: true,
              },
            ],
            monday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 1,
                active: true,
              },
            ],
            tuesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 2,
                active: true,
              },
            ],
            wednesday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 3,
                active: true,
              },
            ],
            thursday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 4,
                active: true,
              },
            ],
            friday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 5,
                active: true,
              },
            ],
            saturday: [
              {
                code: '123456',
                open: '00:00',
                close: '23:59',
                weekDay: 6,
                active: true,
              },
            ],
          },
        },
        promoteValue: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        promoteValueTable: 0,
        valueTable: 0,
        value: 0,
        status: true,
        categoryId: category.id,
      },
      profile,
    }

    try {
      const result = await productService.updateProduct({
        productId: product.id,
        complements: body.complements,
        data: body.data as any,
        profile: body.profile,
      })

      assert.exists(result.product)
      assert.equal(result.product.name, 'Atualizado')
      assert.equal(result.product.description, 'Atualizado')

      assert.equal(result.product.disponibility.store.delivery, true)
      assert.equal(result.product.disponibility.week.sunday[0].open, '00:00')
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível adicionar novos complementos ao produto', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const product = await Product.create({
      name: 'Teste',
      description: 'Teste',
      order: 1,
      value: 0,
      valueTable: 0,
      categoryId: category.id,
    })

    const newComplement = {
      name: 'Novo Complemento',
      itens: [
        {
          name: 'Item 1',
        },
      ],
    }

    try {
      const result = await productService.updateProduct({
        productId: product.id,
        complements: [newComplement] as any,
        data: {} as any,
        profile,
      })

      assert.exists(result.product.complements)
      assert.lengthOf(result.product.complements, 1)
      assert.equal(result.product.complements[0].name, newComplement.name)
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível vincular complementos existentes ao produto', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const existingComplement = await Complement.create({
      name: 'Complemento Existente',
      itens: [
        {
          name: 'Item 1',
          code: '123456',
        },
      ] as ComplementItem[],
    })

    const product = await Product.create({
      name: 'Teste',
      description: 'Teste',
      order: 1,
      value: 0,
      valueTable: 0,
      categoryId: category.id,
    })

    try {
      const result = await productService.updateProduct({
        productId: product.id,
        complements: [{ id: existingComplement.id }] as any,
        data: {} as any,
        profile,
      })

      assert.exists(result.product.complements)
      assert.lengthOf(result.product.complements, 1)
      assert.equal(result.product.complements[0].id, existingComplement.id)
      assert.equal(result.product.complements[0].name, 'Complemento Existente')
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível remover complementos do produto', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const product = await Product.create({
      name: 'Teste',
      description: 'Teste',
      order: 1,
      value: 0,
      valueTable: 0,
      categoryId: category.id,
    })

    const complement1 = await Complement.create({
      name: 'Complemento 1',
      itens: [
        {
          name: 'Item 1',
          code: '123456',
        },
      ] as ComplementItem[],
    })

    const complement2 = await Complement.create({
      name: 'Complemento 2',
      itens: [
        {
          name: 'Item 2',
          code: '7891011',
        },
      ] as ComplementItem[],
    })

    await product.related('complements').attach([complement1.id, complement2.id])

    try {
      let complements = await product.related('complements').query()
      assert.lengthOf(complements, 2)

      await productService.updateProduct({
        productId: product.id,
        complements: [{ id: complement1.id }] as any,
        data: {} as any,
        profile,
      })

      complements = await product.related('complements').query()
      assert.lengthOf(complements, 1)
      assert.equal(complements[0].id, complement1.id)

      assert.notInclude(
        complements.map((c) => c.id),
        complement2.id
      )
    } catch (error) {
      throw error
    }
  })

  test('Deve lançar um erro ao tentar atualizar um produto com dados inválidos', async ({
    assert,
  }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const product = await Product.create({
      name: 'Teste',
      description: 'Teste',
      order: 1,
      value: 0,
      valueTable: 0,
      categoryId: category.id,
    })

    try {
      await productService.updateProduct(product as any)
    } catch (error) {
      assert.exists(error)
    }
  })
})
