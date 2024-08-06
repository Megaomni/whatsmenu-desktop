import factory from '@adonisjs/lucid/factories'
import Bartender from '#models/bartender'

export const BartenderFactory = factory
  .define(Bartender, async ({ faker }) => {
    return {}
  })
  .build()
