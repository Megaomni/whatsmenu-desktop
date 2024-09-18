import factory from '@adonisjs/lucid/factories'
import Category from '#models/category'

export const CategoryFactory = factory
  .define(Category, async ({ faker }) => {
    return {
      name: faker.commerce.department(),
      order: faker.number.int({ min: 1, max: 1000 }),
      status: faker.datatype.boolean(),
      type: faker.helpers.arrayElement<'default' | 'pizza'>(['pizza', 'default']),
      disponibility: {
        store: {
          delivery: faker.datatype.boolean(),
          table: faker.datatype.boolean(),
          package: faker.datatype.boolean(),
        },
      },
      options: {
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
