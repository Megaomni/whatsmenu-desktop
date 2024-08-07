'use strict'


const Profile = use('App/Models/Profile')
const Table = use('App/Models/Table')
const Tablev3 = use('App/Models/v3/Table')
const Profilev3 = use('App/Models/v3/Profile')
const Encryption = use('Encryption')

class ApiController {
  async profilesActived({ request, response }) {
    try {
      const { page } = request.all()
      const profiles = await Profile.query().where('status', true).paginate(page, 30)
      return response.json(profiles)
    } catch (error) {
      throw error
    }
  }

  async decryptTableCookie({ request, response }) {
    console.log('decryptTableCookie',  "AQUI ==>  line  22")
    // return response.json({wm: profile});
    let { cookie } = request.all()
    cookie = Encryption.decrypt(cookie)
    cookie = JSON.parse(cookie)
    // console.log(cookie, request.all(),  'DECRYPT')
    let profile;
    let tableProfile = await Table.find(cookie.id)
    if (!tableProfile) {
      tableProfile = await Tablev3.find(cookie.id)
      profile = await Profilev3.query().where('id', tableProfile.profileId).with('user').first()
    } else {
      profile = await Profile.query().where('id', tableProfile.profileId).with('user').first()
    }

    let table

    if (profile && profile.options.migrated_at || !profile || (profile && profile.id >= 1000000)) {
      if (!profile) {
        profile = await Profilev3.find(profile.id)
      }
      table = await Tablev3.query().where({'id': cookie.id, profileId: profile.id}).with('opened.commands.carts.itens').first()
      // console.log('MIDDLEWARE NEXT ==>', table)
    } else {
      table = await Table.query().where('id', cookie.id).with('tablesOpened', query => {
        return query.from('table_openeds').where('status', 1).with('commands.requests')
      }).first()
      // console.log('MIDDLEWARE ADM ==>', table)
    }
    console.log(table, "TABLE")
    try {
      table = table.toJSON()
      // const data = request.except(['_csrf'])
      console.log({chola: table});
      if (table.tablesOpened && table.tablesOpened.length) {
        table.fees = table.tablesOpened[0].fees
        table.formsPayment = table.tablesOpened[0].formsPayment
        table.commands = table.tablesOpened[0].commands
        table.tableOpenedId = table.tablesOpened[0].id
        delete table.tablesOpened
      } else if (table.opened && table.opened.id) {
        table.fees = table.opened.fees
        table.formsPayment = table.opened.formsPayment
        table.commands = table.opened.commands
        table.tableOpenedId = table.opened.id
        delete table.opened
      } else {
        table.fees = []
        table.formsPayment = []
        table.commands = []
        table.newTable = true
        delete table.tablesOpened
      }
      return response.json(table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = ApiController
