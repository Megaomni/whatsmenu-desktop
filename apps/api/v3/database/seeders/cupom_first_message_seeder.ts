import Profile from '#models/profile'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    try {
      let page = 1
      let profiles
      do {
        profiles = await Profile.query().paginate(page, 500)
        for (const profile of profiles) {
          if (profile.options.placeholders) {
            profile.options.placeholders.cupomFirstMessage = `Olá *[NOME]!*\nSeja bem vindo ao ${profile.name} \n\nÉ sua primeira vez aqui, separei um cupom especial para você \n`
            await profile.save()
          }
        }
        page++
      } while (profiles?.currentPage < profiles?.lastPage)
    } catch (error) {
      console.error(error)
    }
  }
}
