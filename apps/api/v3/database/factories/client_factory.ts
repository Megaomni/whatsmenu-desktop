import factory from '@adonisjs/lucid/factories'
import Client from '#models/client'
import { DateTime } from 'luxon'
import { CartFactory } from './cart_factory.js'

export const ClientFactory = factory
  .define(Client, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      whatsapp: faker.phone.number(),
      secretNumber: faker.string.numeric(11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      birthday_date: DateTime.fromJSDate(faker.date.past()),
    }
  })
  .relation('carts', () => CartFactory)
  .build()
