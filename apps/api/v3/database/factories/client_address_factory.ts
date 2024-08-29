import factory from '@adonisjs/lucid/factories'
import ClientAddress from '#models/client_address'

export const ClientAddressFactory = factory
  .define(ClientAddress, async ({ faker }) => {
    return {}
  })
  .build()
