'use strict'
const User = use('App/Models/User')
const Profile = use('App/Models/Profile')

/*
|--------------------------------------------------------------------------
| FixDuplicateProfileSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

class FixDuplicateProfileSeeder {
  async run() {
    try {
      const users = await User.query()
        .whereRaw(`controls->"$.type" is null and email NOT REGEXP 'excluir|deletar|@whatsmenu.com.br|@grovecompany.com.br'`)
        .with('profile')
        .fetch()

      const usr = users.toJSON()
      for (let user of usr) {
        if (user.profile) {
          const profiles = await Profile.query().where('userId', user.id).where('id', '<>', user.profile.id).fetch()
          if (profiles && profiles.rows && profiles.rows.length > 0) {
            for (let p of profiles.rows) {
              p.status = 2
              await p.save()
            }
          }
        }
      }
      return 'atualizado!'
    } catch (error) {
      console.error(error)
    }
  }
}

module.exports = FixDuplicateProfileSeeder
