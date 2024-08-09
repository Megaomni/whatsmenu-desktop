import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await User.create({
      id: 1,
      fullName: 'Wagner Vital',
      email: 'wagnervitaldo@gmail.com',
      password: '123456',
    })
  }
}
