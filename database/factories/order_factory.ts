import Order from '#models/order'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { ItemFactory } from './item_factory.js'
import { CustomerFactory } from './customer_factory.js'
import { MerchantFactory } from './merchant_factory.js'
import { PaymentFactory } from './payment_factory.js'

export const OrderFactory = factory
  .define(Order, async ({ faker }) => {
    const streetName = faker.location.street()
    const streetNumber = faker.string.numeric({ length: { min: 1, max: 5 } })
    const pickupCode = faker.string.numeric({ length: { min: 1, max: 5 } })
    return {
      orderId: faker.string.uuid(),
      orderStatus: faker.helpers.arrayElement<Order['orderStatus']>([
        'CONFIRMED',
        'CANCELLED',
        'PLACED',
        'DISPATCHED',
        'PREPARATION_STARTED',
        'READ_TO_PICKUP',
        'CONCLUDED',
      ]),
      displayId: faker.string.numeric({ length: { min: 4, max: 6 } }),
      orderTiming: faker.helpers.arrayElement<Order['orderTiming']>(['IMMEDIATE', 'SCHEDULED']),
      orderType: faker.helpers.arrayElement<Order['orderType']>(['DELIVERY', 'TAKEOUT']),
      delivery: {
        mode: 'DEFAULT',
        pickupCode,
        deliveredBy: faker.helpers.arrayElement<Order['delivery']['deliveredBy']>([
          'IFOOD',
          'MERCHANT',
        ]),
        deliveryAddress: {
          pickupCode,
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          reference: faker.lorem.sentence(),
          complement: faker.lorem.sentence(),
          postalCode: faker.location.zipCode(),
          streetName,
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
          neighborhood: faker.word.sample(),
          streetNumber,
          formattedAddress: `${streetName}, ${streetNumber}`,
        },
        observations: faker.lorem.sentence(),
        deliveryDateTime: DateTime.local().toISO(),
      },
      total: {
        benefits: faker.number.float({ min: 0, max: 100 }),
        subTotal: faker.number.float({ min: 0, max: 100 }),
        deliveryFee: faker.number.float({ min: 0, max: 100 }),
        orderAmount: faker.number.float({ min: 0, max: 100 }),
        additionalFees: faker.number.float({ min: 0, max: 0.99 }),
      },
      additionalInfo: {
        metadata: {
          developerId: faker.string.uuid(),
          customerEmail: faker.internet.email(),
          developerEmail: faker.internet.email(),
          deliveryProduct: faker.lorem.sentence(),
          logisticProvider: faker.lorem.sentence(),
        },
      },

      created_at: DateTime.local(),
      updatedAt: DateTime.local(),
    }
  })
  .relation('itens', () => ItemFactory)
  .relation('customer', () => CustomerFactory)
  .relation('merchant', () => MerchantFactory)
  .relation('payments', () => PaymentFactory)
  .build()
