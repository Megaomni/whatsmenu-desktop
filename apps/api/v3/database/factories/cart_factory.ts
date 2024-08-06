import factory from '@adonisjs/lucid/factories'
import Cart from '#models/cart'

export const CartFactory = factory
  .define(Cart, async ({ faker }) => {
    return {
      total: faker.number.float({ min: 1, max: 1000 }),
      type: faker.helpers.arrayElement(['D', 'T', 'P']) as Cart['type'],
      obs: faker.lorem.sentence(),
      taxDelivery: faker.number.float({ min: 1, max: 1000 }),
      code: faker.number.int().toString(),
      timeDelivery: faker.date.future().toISOString(),
    }
  })
  .build()
