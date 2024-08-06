// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ProfilesController {
  /**
   * Recupera os dados do perfil do usuário, realiza as operações necessárias
   * e retorna as informações do perfil na resposta.
   *
   * @param {HttpContext} auth - O objeto HttpContext contendo informações de autenticação.
   * @param {HttpContext} response - O objeto HttpContext para enviar a resposta.
   * @return {Promise<any>} As informações do perfil na resposta.
   */
  async userProfile({ auth, response }: HttpContext): Promise<any> {
    try {
      const { user } = auth
      if (user) {
        await user.load('profile')
        const nowDate = DateTime.local()

        const { profile } = user

        if (profile) {
          await profile.load('fees', (fees) => fees.whereNull('deleted_at'))
          await profile.load('firstOnlyCupom')

          const oldDates = []
          const specialsDates = profile.options.package?.specialsDates.filter(
            (specialClosedDate) => {
              const specialClosedDateLuxon = DateTime.fromISO(specialClosedDate).set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
              })

              nowDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              const diff = specialClosedDateLuxon.diff(nowDate, 'days').days

              if (diff >= 0) {
                return specialClosedDate
              } else {
                oldDates.push(specialClosedDate)
              }
            }
          )

          if (oldDates.length) {
            profile.options.package.specialsDates = specialsDates
            await profile.save()
          }
        }

        if (!user.security_key && profile) {
          profile.not_security_key = true
        }
        return response.json(profile)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * Atualiza as configurações básicas gerais do perfil do usuário autenticado.
   *
   * @param {HttpContext} context - O objeto de contexto HTTP contendo a requisição, resposta e informações de autenticação.
   * @return {Promise<any>} - Uma promessa que resolve para o objeto de perfil atualizado.
   */
  async generalBasicSettings({ request, response, auth }: HttpContext): Promise<any> {
    try {
      const { deliveryLocal, options } = request.all()
      const user = auth.user
      if (user) {
        await user.load('profile')
        const profile = user.profile

        profile.deliveryLocal = deliveryLocal
        profile.options = { ...profile.options, ...options }

        await profile.save()

        return response.json(profile)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
