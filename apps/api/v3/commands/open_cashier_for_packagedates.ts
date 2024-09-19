import Cart from '#models/cart'
import Cashier from '#models/cashier'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
export default class OpenCashierForPackagedates extends BaseCommand {
  static commandName = 'open:cashier-for-packagedates'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    let page = 1
    let profiles

    try {
      do {
        profiles = await db
          .from('profiles')
          .whereJson('options', { package: { cashierDate: 'deliveryDate' } })
          .paginate(page, 100)
        for await (const profile of profiles) {
          const carts = await Cart.query()
            .where({ profileId: profile.id })
            .whereNull('cashierId')
            .whereBetween('packageDate', [
              DateTime.local().toFormat('yyyy-MM-dd'),
              DateTime.local().plus({ day: 1 }).toFormat('yyyy-MM-dd'),
            ])

          if (carts.length) {
            let cashier = await Cashier.query()
              .where({ profileId: profile.id })
              .whereNull('closed_at')
              .first()

            if (!cashier) {
              const defaultCashier = await db
                .from('bartenders')
                .where({ profileId: profile.id })
                .whereJson('controls', { defaultCashier: true })
                .first()

              cashier = await Cashier.create({
                profileId: profile.id,
                initialValue: 0,
                bartenderId: defaultCashier ? defaultCashier.id : null,
                closed_at: null,
              })
            }

            for await (const cart of carts) {
              cart.cashierId = cashier.id
              await cart.save()
            }
          }
        }
        page++
      } while (page <= profiles.lastPage)
    } catch (error) {
      console.error(error)
    } finally {
      process.exit()
    }
  }
}
