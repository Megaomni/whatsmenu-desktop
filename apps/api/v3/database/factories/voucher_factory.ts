import factory from '@adonisjs/lucid/factories'
import Voucher from '#models/voucher'
import { DateTime } from 'luxon'

export const VoucherFactory = factory
  .define(Voucher, async ({ faker }) => {
    return {
      value: faker.number.float({ min: 10, max: 100 }),
      expirationDate: DateTime.local().plus({ days: faker.number.int({ min: 1, max: 30 }) }),
      status: faker.helpers.arrayElement(['avaliable', 'cancelled', 'used']) as Voucher['status'],
    }
  })
  .build()
