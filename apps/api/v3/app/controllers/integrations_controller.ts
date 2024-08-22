import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class IntegrationsController {
  async createdGrovenfe({ auth, response }: HttpContext) {
    try {
      const { user } = auth
      if (user) {
        await user.load('profile')
        const { profile } = user

        if (profile) {
          profile.options.integrations = { grovenfe: { created_at: DateTime.now().toISO() } }
          await profile.save()
        }

        return response.status(201).json({ grovenfe: profile.options.integrations.grovenfe })
      }
      if (!user) {
        return response.status(404).json({ message: 'Usário não encontrado.' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
