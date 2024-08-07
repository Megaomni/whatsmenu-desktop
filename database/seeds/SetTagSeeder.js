'use strict'

/*
|--------------------------------------------------------------------------
| SetTagSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Profile = use('App/Models/v3/Profile')
const Tag = use('App/Models/v3/Tag')
const ProfileTag = use('App/Models/v3/ProfileTag')
class SetTagSeeder {
  async run () {
    try {
      let profiles = await Profile.query().where('name', 'like', '%pizzaria%').orWhere('name', 'like', '%pizza%').fetch()

      for (const profile of profiles.rows) {
        const tag = await ProfileTag.query().where({profileId: profile.id, tagId: 13}).first()
        if (!tag) {
          await ProfileTag.create({tagId: 13, profileId: profile.id})
        }
      }
      const tags = await Tag.query().where({type: 'gastronomy', status: 1}).whereNull('deleted_at').fetch()

      for (const tag of tags.rows) {
        profiles = await Profile.query().where('name', 'like', `%${tag.name}%`).orWhere('description', 'like', `%${tag.name}%`).fetch()
        for (const profile of profiles.rows) {
          const profileTag = await ProfileTag.query().where({profileId: profile.id, tagId: tag.id}).first()
          if (!profileTag) {
            await ProfileTag.create({tagId: tag.id, profileId: profile.id})
          }
        }
      }

      profiles = await Profile.query().with('categories.products').paginate(1, 500)

      for (let index = 1; index < profiles.lastPage; index++) {
        console.log(profile.id);
        for (const profile of profiles.data) {
          const prof = profile.toJSON()
          for (const category of prof.categories) {
            for (const product of category.products) {
              const teste = tags.rows.find(tag => category.name.includes(tag.name) || product.name.includes(tag.name) || product.description.includes(tag.name))
              if (teste) {
                const profileTag = await ProfileTag.query().where({profileId: profile.id, tagId: tag.id}).first()
                if (!profileTag) {
                  await ProfileTag.create({tagId: tag.id, profileId: profile.id})
                }
              }
            }
          }
        }
        profile = await Profile.query().with('categories.products').paginate(index, 500)
      }


    } catch (error) {
      console.error(error)
    }
  }
}

module.exports = SetTagSeeder
