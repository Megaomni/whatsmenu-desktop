'use strict'

/*
|--------------------------------------------------------------------------
| FixClosedValuesSystemSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Profile = use('App/Models/Profile')
const Cashier = use('App/Models/Cashier')
const Database = use('Database')
const { DateTime } = require('luxon')

class FixClosedValuesSystemSeeder {
  async run() {
    let page = 1
    let cashiers = {}
    try {
      do {
        cashiers = await Cashier.query().with('carts').paginate(page, 10)
        for (const cashier of cashiers.rows) {
          if (cashier.closed_at) {
            const profile = await Profile.find(cashier.profileId)
            let closedValues_system = await Database.raw(`
            SELECT sum(value) as total, payment, flag, created_at, profileId
            FROM carts,
              JSON_TABLE(
                formsPayment,
                '$[*]' COLUMNS(
                        value FLOAT PATH '$.value',
                        payment VARCHAR(20) PATH '$.payment',
                        flag VARCHAR(20) PATH '$.flag'
                      )
              ) AS paymentSummary WHERE created_at BETWEEN ${DateTime.fromJSDate(cashier.created_at).toFormat('"yyyy-MM-dd HH:mm:ss"')} AND ${DateTime.fromJSDate(cashier.closed_at).toFormat('"yyyy-MM-dd HH:mm:ss"')} AND profileId = ${profile.id} GROUP BY total, payment, flag, created_at, profileId;
            `)
            const formsPayment = profile.formsPayment
            formsPayment.forEach((formPayment) => {
              const notIncludes = closedValues_system[0].some((value) => value.formPayment === formPayment.label)
              if (!notIncludes) {
                const newCloseValue = { payment: formPayment.label, total: 0 }
                if (formPayment.flags && formPayment.flags.length) {
                  formPayment.flags.forEach((flag) => {
                    closedValues_system[0].push({ ...newCloseValue, flag: flag.name })
                  })
                } else {
                  closedValues_system[0].push({ ...newCloseValue, flag: null })
                }
              }
            })
            cashier.closedValues_system = closedValues_system[0]
            await cashier.save()
          }
        }
        page++
      } while (page <= cashiers.pages.lastPage)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = FixClosedValuesSystemSeeder
