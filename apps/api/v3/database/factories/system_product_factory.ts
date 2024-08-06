import factory from '@adonisjs/lucid/factories'
import SystemProduct from '#models/system_product'

export const SystemProductFactory = factory
  .define(SystemProduct, async ({ faker }) => {
    return {}
  })
  .build()
