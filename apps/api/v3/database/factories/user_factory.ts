import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { DateTime } from 'luxon'
import { ProfileFactory } from './profile_factory.js'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      secretNumber: faker.string.numeric(11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      email: faker.internet.email(),
      whatsapp: faker.phone.number(),
      password: '123456',
      security_key: '123456',
      due: faker.number.int({ min: 1, max: 30 }),
      controls: {
        print: {
          app: false,
        },
        period: 'monthly',
        attempts: 0,
        currency: 'brl',
        recovery: {},
        salePrint: false,
        nextInvoice: null,
        salePrintQTD: 1,
        serviceStart: false,
        forceSecurity: false,
        lastAdmAccess: [],
        disableInvoice: false,
        bilhetParcelament: false,
        beta: false,
        firstAccess: DateTime.fromJSDate(faker.date.past()).toISO() as string,
        lastAccess: {
          date: DateTime.fromJSDate(faker.date.past()).toISO() as string,
          ip: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        type: 'user',
      },
    }
  })
  .relation('profile', () => ProfileFactory)
  .build()
