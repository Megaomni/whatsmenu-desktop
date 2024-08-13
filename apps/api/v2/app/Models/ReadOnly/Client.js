'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Client extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeCreate', async (client) => {
      client.last_requests = []
      client.controls = {
        requests: {
          quantity: 0,
          total: 0,
        },
      }
    })

    this.addHook('beforeSave', async (client) => {
      client.last_requests = JSON.stringify(client.last_requests ? client.last_requests : [])
      client.controls = JSON.stringify(
        client.controls
          ? client.controls
          : {
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
              requests: {
                quantity: 0,
                total: 0,
              },
            }
      })
    })
  }

  profile() {
    return this.belongsTo('App/Models/ReadOnly/Profile', 'profileId', 'id')
  }

  carts() {
    return this.hasMany('App/Models/ReadOnly/Cart', 'id', 'clientId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  addresses() {
    return this.hasMany('App/Models/ReadOnly/ClientAddress', 'id', 'clientId')
  }
}

module.exports = Client
