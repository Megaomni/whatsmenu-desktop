'use strict'


const Profile = use('App/Models/Profile')
const Profilev3 = use('App/Models/v3/Profile')
const Table = use('App/Models/Table')
const Tablev3 = use('App/Models/v3/Table')
const Encryption = use('Encryption')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class DataBaseConnection {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle(ctx, next) {
    // call next to advance the request
    try {
      console.log(ctx.request.all(), 'REQUEST ALL')
      let { cookie, data } = ctx.request.all()
      let { id } = ctx.params
      console.log(ctx.params);

      if (data && typeof data === 'string' && !id) {
        id = Encryption.decrypt(decodeURIComponent(data)).table
      }
      let profile
      let table

      if (ctx.params.slug && !ctx.params.slug.includes('.ico') && ctx.params.slug !== 'assets') {
        profile = await Profile.query().where('slug', ctx.params.slug).with('user').first()
        if (!profile) {
          profile = await Profilev3.query().where('slug', ctx.params.slug).with('user').first()
        }
      }

      // if (cookie) {
      //   cookie = Encryption.decrypt(cookie)
      //   cookie = JSON.parse(cookie)
      //   table = await this.getTable(profile, cookie.id)
      // } else if (id) {
      //   table = await this.getTable(profile, id)
      // }

      // if (table) {
      //   profile = await Profile.query().where('id', table.profileId).with('user').first()
      // }

      if (ctx.params.slug && ((profile && profile.options.migrated_at) || !profile)) {
        // const migrated_at = profile.options.migrated_at
        profile = await Profilev3.query().where('slug', ctx.params.slug).with('user').first()
        if (profile) {
          profile.options.migrated_at = new Date().toDateString()
        }
      }

      if (cookie) {
        cookie = Encryption.decrypt(cookie)
        cookie = JSON.parse(cookie)
        // console.log(cookie, data, id, "COOKIE")
        table = await this.getTable(profile, cookie.id)
      }

      if (id) {
        console.log('aqui', id)
        table = await this.getTable(profile, id)
      }
      // console.log('MIDDLEWARE ===>', cookie, id)

      // if (table) {
      //   if (profile.options.migrated_at) {
      //     table = await profile.tables().where('id', cookie.id).with('opened.commands.carts.itens').first()
      //     console.log('MIDDLEWARE NEXT ==>', table)
      //   } else {
      //     table = await Table.query().where('id', cookie.id).with('tablesOpened', query => {
      //       return query.from('table_openeds').where('status', 1).with('commands.requests')
      //     }).first()
      //     console.log('MIDDLEWARE ADM ==>', table)
      //   }
      //   ctx.table = table
      console.log('MIDDLEWARE END ==>', table)
      // }
      // console.log('MIDDLEWARE ==> ', profile.id)
      ctx.profile = profile
      ctx.table = table
    } catch (error) {
      console.error({
        message: 'erro na middleware',
        error:  error
      });
      throw error
    }
    await next()
  }

  async getTable(profile, tableId) {
    let table
    let isV3 = (profile && profile.options.migrated_at) || (profile && profile.id >= 1000000)? true : false
    console.log({isV3: isV3});
    try {
      // let tableProfile = await profile.tables().where('id', tableId).first()
      if (!profile) {
        let tableProfile = await profile.tables().where('id', tableId).first()
        if (!tableProfile) {
          tableProfile = await profile.tables().where('id', tableId).first()
          isV3 = true
        }
        profile = await Profile.query().where('id', tableProfile.profileId).with('user').first()
      }

      if (profile && (profile.options.migrated_at || isV3)) {
        if (!profile) {
          profile = await Profilev3.find(profile.id)
        }
        table = await profile.tables().where('id', tableId).with('opened.commands.carts.itens').first()
        // console.log('MIDDLEWARE NEXT ==>', table)
      } else {
        console.log({jason: 'entrou  aqui', isV3, profileId: profile.id, slug: profile.slug});
        table = await profile.tables().where('id', tableId).with('tablesOpened', query => {
          if (profile.id < 1000000 || !isV3) {
            console.log('puxa requests');
            return query.where('status', 1).with('commands.requests')
          } else {
            console.log('puxa carts');
            return query.where('status', 1).with('commands.carts.itens')
          }
        }).first()
        // console.log('MIDDLEWARE ADM ==>', table)
      }
      // console.log('MIDDLEWARE END ==>', table)
      return table
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = DataBaseConnection
