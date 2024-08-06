import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Cupom from '#models/cupom'

export default class extends BaseSeeder {
  async run() {
    const cupons = await Cupom.query().where('code', 'LIKE', '%-YYYY-%').whereNotNull('deleted_at')

    for (const cupom of cupons) {
      if (cupom.deleted_at) {
        cupom.code = `${cupom.code.split('-YYYY-')[0]}-${cupom.deleted_at.toFormat('yyyy-MM-dd HH:mm:ss')}`
        await cupom.save()
      }
    }
  }
}
