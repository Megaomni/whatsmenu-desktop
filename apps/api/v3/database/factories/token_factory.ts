import factory from '@adonisjs/lucid/factories'
import Token from '#models/token'

export const TokenFactory = factory
  .define(Token, async ({ faker }) => {
    return {}
  })
  .build()
