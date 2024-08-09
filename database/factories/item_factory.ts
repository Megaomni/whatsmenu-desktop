import factory from '@adonisjs/lucid/factories'
import Item from '#models/item'

export const ItemFactory = factory
  .define(Item, async ({ faker }) => {
    return {
      name: faker.word.sample(),
      price: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
    }
  })
  .build()
