'use strict'

/*
|--------------------------------------------------------------------------
| CartsClientSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Database = use('Database');
const Client = use('App/Models/Client')

class CartsClientSeeder {
  async run () {
// precisa fazer paginate
    const orderStats = await Client.query().with('carts').fetch()

    for (const client of orderStats.rows) {
      client.controls.requests.quantity = client.toJSON().carts.length
      client.controls.requests.total = Number(client.toJSON().carts.reduce((total, cart) => total+= cart.total,0).toFixed(2))

      console.log(client)
      await client.save()
    }

  }
  }


module.exports = CartsClientSeeder
