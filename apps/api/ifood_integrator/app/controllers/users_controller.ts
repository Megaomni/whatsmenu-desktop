import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  /**
   * Cria um novo usuário e gera um token de acesso para autenticação.
   *
   * @param {HttpContext} context - O objeto de contexto HTTP contendo a requisição e a resposta.
   * @param {object} context.request - O objeto de requisição contendo os dados do usuário.
   * @param {string} context.request.body().email - O e-mail do usuário.
   * @param {string} context.request.body().password - A senha do usuário.
   * @param {string} context.request.body().fullName - O nome completo do usuário.
   * @param {object} context.response - O objeto de resposta para enviar o resultado.
   * @return {Promise<object>} A resposta JSON contendo o token de acesso.
   * @throws {Error} Se ocorrer um erro durante a criação do usuário ou do token de acesso.
   */
  async create({ request, response }: HttpContext) {
    try {
      const { email, password, fullName } = request.body()
      const userAlreadyExists = await User.findBy('email', email)

      if (userAlreadyExists) {
        return response.status(400).badRequest({ error: 'Usuário já existe' })
      }

      const user = await User.create({ email, password, fullName })
      const token = await User.accessTokens.create(user)

      return response.status(201).json({ token })
    } catch (error) {
      throw error
    }
  }
}
