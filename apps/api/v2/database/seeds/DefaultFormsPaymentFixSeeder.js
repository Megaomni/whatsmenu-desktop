'use strict'

/*
|--------------------------------------------------------------------------
| DefaultFormsPaymentFixSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Profile = use('App/Models/Profile')

class DefaultFormsPaymentFixSeeder {
  async run() {
    const ids = [
      1002811,
      1002813,
      1002815,
      1002817,
      1002819,
      1002822,
      1002823,
      1002832,
      1002836,
      1002838,
      1002843,
      1002844,
      1002845,
      1002846,
      1002847,
      1002849,
      1002851,
      1002852,
      1002853,
      1002854,
      1002855,
      1002856,
      1002857,
      1002858,
      1002859,
      1002861,
      1002862,
      1002863,
      1002864,
      1002865,
      1002866,
      1002867,
      1002868,
      1002869,
      1002870,
      1002871,
      1002873,
      1002874,
      1002875,
      1002876,
      1002877,
      1002878
    ]
    const profiles = await Profile.query().whereIn('id', ids).fetch()
    for (const profile of profiles.rows) {
      if (!profile.formsPayment.some(formPayment => formPayment.payment === 'pix')) {
        profile.formsPayment = profile.formsPayment.concat([
          { flags: [], status: false, payment: 'snack' },
          { flags: [], status: false, payment: 'food' },
          { key: { type: '', value: '' }, status: false, payment: 'pix' },
          { key: { type: 'email', value: '' }, status: false, payment: 'picpay' },
        ]);
        console.log(`Adicionando formas de pagamento padrão para perfil: ${profile.id}`)
        await profile.save()
      }
    }
  }
}

module.exports = DefaultFormsPaymentFixSeeder
