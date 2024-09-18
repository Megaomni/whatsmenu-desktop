import factory from '@adonisjs/lucid/factories'
import Product from '#models/product'

export const ProductFactory = factory
  .define(Product, async ({ faker }) => {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      value: faker.number.float({ min: 1, max: 1000 }),
      valueTable: faker.number.float({ min: 1, max: 1000 }),
      promoteValue: faker.number.float({ min: 1, max: 1000 }),
      promoteValueTable: faker.number.float({ min: 1, max: 1000 }),
      order: faker.number.int({ min: 1, max: 1000 }),
      image: faker.word.sample(),
      status: true,
      promoteStatus: true,
      promoteStatusTable: true,

      ncm_code: faker.word.sample(),
      disponibility: {
        store: {
          delivery: faker.datatype.boolean(),
          table: faker.datatype.boolean(),
          package: faker.datatype.boolean(),
        },
        week: [
          {
            sunday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 1,
              },
            ],
            monday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 2,
              },
            ],
            tuesday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 3,
              },
            ],
            wednesday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 4,
              },
            ],
            thursday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 5,
              },
            ],
            friday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 6,
              },
            ],
            saturday: [
              {
                code: faker.string.uuid(),
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 7,
              },
            ],
          },
        ] as any,
      },
    }
  })
  .build()
