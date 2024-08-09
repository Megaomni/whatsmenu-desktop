import factory from '@adonisjs/lucid/factories'
import Customer from '#models/customer'

export const CustomerFactory = factory
  .define(Customer, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      phone: {
        number: faker.phone.number(),
        localizer: faker.string.numeric(8),
        localizerExpiration: faker.date.anytime().toISOString(),
      },
      customerId: faker.string.uuid(),
    }
  })
  .build()
