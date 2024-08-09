import factory from '@adonisjs/lucid/factories'
import Merchant from '#models/merchant'

export const MerchantFactory = factory
  .define(Merchant, async ({ faker }) => {
    return {
      merchantId: faker.string.uuid(),
      wm_id: faker.string.numeric(),
    }
  })
  .build()
