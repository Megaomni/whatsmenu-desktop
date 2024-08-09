import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { test } from '@japa/runner'

test.group('User', () => {
  test('Deve ser possível criar um usuário e retornar o token de acesso ao serviço', async ({
    assert,
    client,
  }) => {
    const newUser: Partial<User> = {
      email: 'XkDZ7@example.com',
      fullName: 'Whatsmenu',
      password: '123456',
    }
    try {
      const response = await client.post('/user').json(newUser)
      response.assertStatus(201)
      assert.isOk(response.body().token)
    } catch (error) {
      throw error
    }
  })
  test('Não deve ser possível criar um usuário com o mesmo email', async ({ client }) => {
    let response
    try {
      const user = await UserFactory.create()
      response = await client.post('/user').json(user.toJSON())
    } catch (error) {
      response!.assertStatus(400)
      response!.assertBodyContains({
        error: 'Usuário já existe',
      })
    }
  })

  test('Não deve ser possível criar um usuário sem passar o email', async ({ assert, client }) => {
    const invalidNewUser: Partial<User> = {
      fullName: 'Whatsmenu',
      password: '123456',
    }

    try {
      await client.post('/user').json(invalidNewUser)
    } catch (error) {
      assert.equal(JSON.parse(error).status, 500)
    }
  })
})
