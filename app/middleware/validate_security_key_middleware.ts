import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { apiV2 } from '../lib/axios.js'

export default class ValidateSecurityKeyMiddleware {
  async handle({ auth, response, request }: HttpContext, next: NextFn) {
    const { user } = auth
    const { security_key } = request.all()
    if (!user) {
      return response.status(404).json({ message: 'Email inválido!' })
    }
    try {
      const { data } = await apiV2.post('/validateSecurityKey', {
        userId: user.id,
        key: '@WhatsMenu*2024',
        security_key,
      })
      if (data.isValid) {
        user.security_key = security_key
        await user.save()
      }
    } catch (error) {
      console.error(error)
      throw error
    }

    const output = await next()
    return output
  }
}
