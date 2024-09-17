import { test } from '@japa/runner'
import sinon from 'sinon'
import { ProductService } from '../../app/services/product_service.js'
import Profile from '#models/profile'
import { UserFactory } from '#database/factories/user_factory'
import Category from '#models/category'
import User from '#models/user'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

  test('Deve ser possível criar um novo produto', async ({ assert }) => {
    // Arrange
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
      const response = await productService.createProduct(body)
      assert.exists(response.product)
      assert.equal(response.product.name, 'Teste')
      assert.equal(response.product.description, 'Teste')
      assert.equal(response.product.categoryId, category.id)
      assert.deepEqual(response.product.disponibility, body.data.disponibility)
    } catch (error) {
      throw error
    }
  })

  test('Deve ser possível criar um produto com imagem', async ({ assert }) => {
    const category = await Category.create({
      name: 'Teste',
      profileId: profile.id,
      type: 'default',
      status: true,
    })

    const mockImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/gg4FFsAAAAASUVORK5CYII='

    const body = {
      image: mockImageBase64,
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
      const response = await productService.createProduct(body)
      assert.exists(response.product.image, 'Imagem associada ao produto não foi encontrada')
    } catch (error) {
      throw error
    }
  })
})
