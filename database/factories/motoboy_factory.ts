import factory from '@adonisjs/lucid/factories'
import Motoboy from '#models/motoboy'

export const MotoboyFactory = factory
  .define(Motoboy, async ({ faker }) => {
    return {}
  })
  .build()
