'use strict'

const { default: axios } = require('axios')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Env = use('Env')

class Client extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeCreate', async (client) => {
      client.last_requests = []
      client.controls = {
        pushSubscription: null,
        requests: {
          quantity: 0,
          total: 0,
        },
      }
    })

    this.addHook('beforeSave', async (client) => {
      if (client.dirty.whatsapp) {
        // try {
        //   const { data } = await axios.post(`${Env.get('BOT_IP')}/whatsapp/checkNumberId`, {
        //     contact: `55${client.whatsapp}`
        //   })
        //   client.controls.whatsapp = data
        // } catch (error) {
        //   console.error(error)
        // }
      }
      client.last_requests = JSON.stringify(client.last_requests ? client.last_requests : [])
      client.controls = JSON.stringify(
        client.controls
          ? client.controls
          : {
              pushSubscription: null,
              requests: {
                quantity: 0,
                total: 0,
              },
            }
      )
    })

    this.addHook('afterSave', async (client) => {
      client.last_requests = client.last_requests ? JSON.parse(client.last_requests) : []
      client.controls = client.controls
        ? JSON.parse(client.controls)
        : {
            pushSubscription: null,
            requests: {
              quantity: 0,
              total: 0,
            },
          }
    })

    this.addHook('afterFind', async (client) => {
      client.last_requests = JSON.parse(client.last_requests)
      client.controls = client.controls
        ? JSON.parse(client.controls)
        : {
            pushSubscription: null,
            requests: {
              quantity: 0,
              total: 0,
            },
          }
    })

    this.addHook('afterFetch', async (clients) => {
      clients.forEach((client) => {
        client.last_requests = JSON.parse(client.last_requests)
        client.controls = client.controls
          ? JSON.parse(client.controls)
          : {
              pushSubscription: null,
              requests: {
                quantity: 0,
                total: 0,
              },
            }
      })
    })

    this.addHook('afterPaginate', async (clients) => {
      clients.forEach((client) => {
        client.last_requests = JSON.parse(client.last_requests)
        client.controls = client.controls
          ? JSON.parse(client.controls)
          : {
              pushSubscription: null,
              requests: {
                quantity: 0,
                total: 0,
              },
            }
      })
    })
  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }

  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'clientId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  addresses() {
    return this.hasMany('App/Models/ClientAddress', 'id', 'clientId')
  }
}

module.exports = Client
