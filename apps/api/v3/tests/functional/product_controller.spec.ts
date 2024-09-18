import { CategoryFactory } from '#database/factories/category_factory'
import { ProductFactory } from '#database/factories/product_factory'
import { ProfileFactory } from '#database/factories/profile_factory'
import { UserFactory } from '#database/factories/user_factory'
import { apiV2 } from '#lib/axios'
import { ProductService } from '#services/product_service'
import { test } from '@japa/runner'
import sinon from 'sinon'

test.group('Product controller', () => {
  //  CRIAR PRODUTO
  test('Deve ser possível criar um novo produto', async ({ client }) => {
    const user = await UserFactory.create()
    const profile = await ProfileFactory.merge({ userId: user.id }).create()
    const category = await CategoryFactory.merge({ profileId: profile.id }).create()
    const product = await ProductFactory.merge({ categoryId: category.id }).create()
    const productServicePostStub = sinon
      .stub(ProductService.prototype, 'createProduct')
      .resolves({ product })
    try {
      const result = await client
        .post('/dashboard/products')
        .loginAs(user)
        .json({
          complements: [],
          data: {
            categoryId: 1,
          },
        })
      result.assertStatus(201)
    } catch (error) {
      throw error
    } finally {
      productServicePostStub.restore()
    }
  })

  test('Deve ser possível retornar uma exceção ao tentar criar um novo produto', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const profile = await ProfileFactory.merge({ userId: user.id }).create()
    await CategoryFactory.merge({ profileId: profile.id }).create()
    const productServicePostStub = sinon.stub(ProductService.prototype, 'createProduct').throws()
    try {
      await client
        .post('/dashboard/products')
        .loginAs(user)
        .json({
          complements: [],
          data: {
            categoryId: 1,
          },
        })
    } catch (error) {
      assert.exists(error)
    } finally {
      productServicePostStub.restore()
    }
  })

  //ATUALIZAR PRODUTO
  test('Deve ser possível atualizar um novo produto', async ({ client }) => {
    const user = await UserFactory.create()
    const profile = await ProfileFactory.merge({ userId: user.id }).create()
    const category = await CategoryFactory.merge({ profileId: profile.id }).create()
    const product = await ProductFactory.merge({ categoryId: category.id }).create()
    const productServicePutStub = sinon
      .stub(ProductService.prototype, 'updateProduct')
      .resolves({ product })
    const apiV2GetStub = sinon.stub(apiV2, 'get').resolves({ data: { inventory: [] } })
    try {
      const result = await client
        .put('/dashboard/products')
        .loginAs(user)
        .json({
          complements: [],
          id: product.id,
          data: {
            categoryId: 1,
          },
        })
      result.assertStatus(200)
    } catch (error) {
      throw error
    } finally {
      productServicePutStub.restore()
      apiV2GetStub.restore()
    }
  })

  test('Deve ser possível retornar uma exceção ao atualizar um novo produto', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const profile = await ProfileFactory.merge({ userId: user.id }).create()
    const category = await CategoryFactory.merge({ profileId: profile.id }).create()
    const product = await ProductFactory.merge({ categoryId: category.id }).create()
    const productServicePutStub = sinon.stub(ProductService.prototype, 'updateProduct').throws()
    const apiV2GetStub = sinon.stub(apiV2, 'get').resolves({ data: { inventory: [] } })
    try {
      await client
        .put('/dashboard/products')
        .loginAs(user)
        .json({
          complements: [],
          id: product.id,
          data: {
            categoryId: 1,
          },
        })
    } catch (error) {
      assert.exists(error)
    } finally {
      productServicePutStub.restore()
      apiV2GetStub.restore()
    }
  })
})
