'use strict'

/*
|--------------------------------------------------------------------------
| SendWhatsMessageSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Profile = use('App/Models/Profile')

class SendWhatsMessageSeeder {
  async run() {
    let page = 1
    let profiles
    do {
      profiles = await Profile.query().paginate(page, 500)
      for (const profile of profiles.rows) {
        try {
          if (profile && profile.options) {
            profile.options.pdv.sendWhatsMessage = false
            profile.options.placeholders.sendWhatsMessage = '[NOME] pedido efetuado com sucesso, acompanhe o status do seu pedido abaixo!'
          }

          profile.save()
          console.log(profile.id)
        } catch (error) {
          console.error(profile.name, typeof profile.options)
        }
      }
      page++
    } while (profiles.pages.page < profiles.pages.lastPage)
  }
}

module.exports = SendWhatsMessageSeeder
