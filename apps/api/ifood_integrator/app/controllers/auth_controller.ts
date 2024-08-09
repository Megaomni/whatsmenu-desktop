import Merchant from '#models/merchant'
import IfoodService from '#services/ifood_integration_service'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class AuthController {
  /**
   * Autentica o código do usuário e retorna o código do usuário e a URL de verificação.
   *
   * @param {HttpContext} contexto - O contexto HTTP contendo os objetos de autenticação e resposta.
   * @return {Promise<void>} Uma promessa que é resolvida com a resposta JSON contendo o código do usuário e a URL de verificação.
   * @throws {Error} Se ocorrer um erro ao buscar o código do usuário do iFood.
   */
  async authUserCode({ auth, response }: HttpContext) {
    try {
      const user = auth.user

      const responseCode = await IfoodService.userCode()

      if (user) {
        user.controls = {
          ifood: {
            auth: {
              codeVerifier: responseCode.authorizationCodeVerifier,
            },
          },
        }
        await user.save()
      }
      return response.json(responseCode)
    } catch (error) {
      console.error('Error fetching user code from iFood:', error)
      throw error
    }
  }

  /**
   * Autentica o usuário com o código e id fornecidos e recupera o token de acesso e o token de atualização do iFood.
   * Se o comerciante não existir, cria um novo comerciante com o id fornecido.
   * Salva o token de acesso, token de atualização e a data de criação do token nos controles do comerciante.
   *
   * @param {HttpContext} auth - O objeto de contexto HTTP contendo as informações de autenticação.
   * @param {HttpContext} request - O objeto de contexto HTTP contendo os dados da requisição.
   * @param {HttpContext} response - O objeto de contexto HTTP para enviar a resposta.
   * @return {Promise<void>} Retorna uma promessa que é resolvida com a resposta contendo o token de acesso.
   * @throws {Error} Lança um erro se houver um problema ao buscar o token do usuário do iFood.
   */
  async authToken({ auth, request, response }: HttpContext) {
    try {
      const data = request.all()
      const { code, id } = data
      const merchant = await Merchant.firstOrCreate({ wm_id: id })

      const responseToken = await IfoodService.token(code, auth.user!)

      merchant.token = responseToken.accessToken
      merchant.refresh_token = responseToken.refreshToken
      merchant.controls = {
        dateTokenCreated: DateTime.now().toISO(),
      }
      await merchant.save()

      return response.status(200).json(responseToken)
    } catch (error) {
      console.error('Error fetching user token from iFood:', error)
      throw error
    }
  }
}
