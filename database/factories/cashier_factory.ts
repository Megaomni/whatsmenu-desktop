import factory from '@adonisjs/lucid/factories'
import Cashier from '#models/cashier'

export const CashierFactory = factory
  .define(Cashier, async ({ faker }) => {
    return {}
  })
  .build()
