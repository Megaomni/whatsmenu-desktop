// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ProfilesController {
  async userProfile({ auth, response }: HttpContext) {
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
}
