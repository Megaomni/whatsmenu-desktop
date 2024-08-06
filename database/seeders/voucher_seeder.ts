import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Profile from '#models/profile'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    let page = 1
    let profiles
    do {
      profiles = await Profile.query().paginate(page, 500)
      for (const profile of profiles) {
        try {
          if (profile instanceof Profile) {
            profile.options.voucher = [
              {
                expirationDays: 20,
                status: false,
                percentage: 10,
                created_at: DateTime.local().setLocale('pt-BR').toISO(),
              },
            ]
            try {
              await profile.save()
              console.log(profile.id)
            } catch (error) {
              console.error(error)
            }
          } else {
            console.error('profile is not an instance of Profile:', profile)
          }
        } catch (error) {
          console.error(profile.name, error)
        }
      }
      page++
      profiles = await Profile.query().paginate(page, 500)
    } while (profiles.currentPage < profiles.lastPage)
  }
}
