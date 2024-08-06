import factory from '@adonisjs/lucid/factories'
import Cupom from '#models/cupom'

export const CupomFactory = factory
  .define(Cupom, async ({ faker }) => {
    return {
      code: faker.lorem.word().toUpperCase(),
      value: faker.number.float({ min: 0, max: 100 }),
      minValue: faker.number.float({ min: 0, max: 100 }),
      type: faker.helpers.arrayElement(['value', 'freight', 'percent']) as Cupom['type'],
      firstOnly: faker.datatype.boolean(),
    }
  })
  .build()
