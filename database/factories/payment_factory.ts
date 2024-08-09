import factory from '@adonisjs/lucid/factories'
import Payment from '#models/payment'

export const PaymentFactory = factory
  .define(Payment, async ({ faker }) => {
    return {
      prepaid: faker.number.float({ min: 0.01, max: 200, precision: 0.01 }),
      pending: faker.number.float({ min: 0.01, max: 200, precision: 0.01 }),
    }
  })
  .build()
