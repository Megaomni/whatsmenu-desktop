import { test } from '@japa/runner'
import Cart from '#models/cart'
import { CartFactory } from '#database/factories/cart_factory'
import User from '#models/user'
import { UserFactory } from '#database/factories/user_factory'
import sinon from 'sinon'

test.group('Carts', (group) => {
  let user: User | null
  let cart: Cart

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    const profileId = user!.profile.id
    cart = await CartFactory.merge({ status: 'production', profileId }).create()
  })

  test('Deve ser possível retornar o status do carrinho', async ({ assert, client }) => {
    const modelStub = sinon.stub(Cart, 'query').resolvesThis()
    const expected = { status: 'production', id: cart.id }
    const queryBuilderStub = {
      where: sinon.stub().returnsThis(),
      first: sinon.stub().resolves(expected),
    }

    modelStub.withArgs({ connection: 'mysql_pooling' }).returns(queryBuilderStub as any)
    try {
      const response = await client.get(
        `/api/v3/business/${user!.profile!.slug}/cart/${cart.id}/getStatus`
      )

      response.assertStatus(200)
      response.assertBodyContains(expected)
    } catch (error) {
      throw error
    } finally {
      modelStub.restore()
    }
  })

  test('Deve retornar erro quando carrinho não for encontrado', async ({ assert, client }) => {
    try {
      const response = await client.get(`/business/:slug/cart/${cart.id}/getStatus`)

      response.assertStatus(404)
    } catch (error) {
      console.error(error)
      throw error
    }
  })
})
