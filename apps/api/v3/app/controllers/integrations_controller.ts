import { facebookPixelValidator } from '#validators/facebook_pixel'
import { googleValidator } from '#validators/google'
import type { HttpContext } from '@adonisjs/core/http'

export default class IntegrationsController {
  async facebookPixel({ auth, request, response }: HttpContext) {
    try {
      const data = request.all()

      const { pixel } = await facebookPixelValidator.validate(data)

      const user = auth.user

      if (user) {
        await user.load('profile')
        user.profile.options.tracking.pixel = pixel
        await user.profile.save()

        return response.json({ profile: user.profile })
      }
    } catch (error) {
      throw error
    }
  }

  async google({ auth, request, response }: HttpContext) {
    try {
      const data = request.all()

      const { google, googleAds } = await googleValidator.validate(data)

      const user = auth.user

      if (user) {
        await user.load('profile')
        if (google) {
          user.profile.options.tracking.google = google
        }
        if (googleAds) {
          user.profile.options.tracking.googleAds = googleAds
        }
        await user.profile.save()

        return response.json({ profile: user.profile })
      }
    } catch (error) {
      throw error
    }
  }
}
