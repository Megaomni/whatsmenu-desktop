import Fee from '#models/fee'
import env from '#start/env'
import { FormsPaymentType } from '#types/forms_payment'
import type { ProfileAddress, ProfileOptions, ProfileTaxDeliveryType } from '#types/profile'
import type { WeekType } from '#types/week'
import {
  BaseModel,
  afterFetch,
  afterFind,
  afterPaginate,
  beforeCreate,
  beforeSave,
  belongsTo,
  column,
  hasMany,
  hasOne,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { cupomFirstMessageReplace } from '../utils/cupom_first_message_replace.js'
import { decryptEmoji } from '../utils/emoji_formater.js'
import { generateWeekDisponibility } from '../utils/generate_disponibility_week.js'
import { generateProfileDefaultOptions } from '../utils/generate_profile_default_options.js'
import Bartender from './bartender.js'
import Cart from './cart.js'
import Cashier from './cashier.js'
import Category from './category.js'
import Client from './client.js'
import Cupom from './cupom.js'
import Domain from './domain.js'
import Motoboy from './motoboy.js'
import Table from './table.js'
import User from './user.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'userId', serializeAs: 'userId' })
  declare userId: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column({ columnName: 'typeStore', serializeAs: 'typeStore' })
  declare typeStore: string | null

  @column()
  declare status: boolean

  @column({ columnName: 'deliveryLocal', serializeAs: 'deliveryLocal' })
  declare deliveryLocal: boolean

  @column({ columnName: 'showTotal', serializeAs: 'showTotal' })
  declare showTotal: boolean

  @column()
  declare description: string | null

  @column()
  declare whatsapp: string

  @column({ columnName: 'typeDelivery', serializeAs: 'typeDelivery' })
  declare typeDelivery: 'km' | 'neighborhood'

  @column({
    columnName: 'taxDelivery',
    serializeAs: 'taxDelivery',
    prepare: (taxDelivery: ProfileTaxDeliveryType[]) => JSON.stringify(taxDelivery),
  })
  declare taxDelivery: ProfileTaxDeliveryType[]

  @column({})
  declare address: ProfileAddress

  @column({
    columnName: 'formsPayment',
    serializeAs: 'formsPayment',
    prepare: (formsPayment: FormsPaymentType[]) => JSON.stringify(formsPayment),
    consume: jsonSerialize,
  })
  declare formsPayment: FormsPaymentType[]

  @column({})
  declare week: WeekType<'profile'>

  @column({ columnName: 'timeZone', serializeAs: 'timeZone' })
  declare timeZone: string

  @column({
    prepare: (options: ProfileOptions) => JSON.stringify(options),
    consume: (options) => {
      if (options.placeholders) {
        Object.entries(options.placeholders as ProfileOptions['placeholders']).forEach(
          ([key, placeholder]) => {
            if (key === 'welcomeMessage' && placeholder) {
              placeholder = placeholder.replace('*Ofertas', ' *Ofertas')
            }
            options.placeholders[key] = decryptEmoji(placeholder)
          }
        )
      }
      return jsonSerialize(options)
    },
  })
  declare options: ProfileOptions

  @column({ columnName: 'minval', serializeAs: 'minval' })
  declare minval: number | null

  @column({ columnName: 'minvalLocal', serializeAs: 'minvalLocal' })
  declare minvalLocal: number | null

  @column()
  declare request: number

  @column()
  declare command: number

  @column()
  declare logo: string | null

  @column()
  declare background: string | null

  @column()
  declare color: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @column({ serializeAs: 'not_security_key' })
  declare not_security_key?: boolean

  @belongsTo(() => User, {
    localKey: 'userId',
  })
  declare plan: BelongsTo<typeof User>

  @hasMany(() => Client, {
    foreignKey: 'profileId',
  })
  declare clients: HasMany<typeof Client>

  @hasMany(() => Category, {
    foreignKey: 'profileId',
    onQuery: (query) => {
      query.whereNotNull('deleted_at')
    },
  })
  declare categories: HasMany<typeof Category>

  @hasMany(() => Category, {
    foreignKey: 'profileId',
  })
  declare allCategories: HasMany<typeof Category>

  @hasMany(() => Cart, {
    foreignKey: 'profileId',
  })
  declare carts: HasMany<typeof Cart>

  @hasMany(() => Motoboy, {
    foreignKey: 'profileId',
    onQuery: (query) => {
      query.whereNotNull('deleted_at')
    },
  })
  declare motoboys: HasMany<typeof Motoboy>

  @hasMany(() => Cupom, {
    foreignKey: 'profileId',
  })
  declare cupons: HasMany<typeof Cupom>

  @hasOne(() => Cupom, {
    foreignKey: 'profileId',
    onQuery: (query) => {
      query.where({ firstOnly: true, status: true, deleted_at: null })
    },
  })
  declare firstOnlyCupom: HasOne<typeof Cupom>

  @hasMany(() => Domain, {
    foreignKey: 'profileId',
  })
  declare domains: HasMany<typeof Domain>

  @hasMany(() => Table, {
    foreignKey: 'profileId',
  })
  declare tables: HasMany<typeof Table>

  @hasMany(() => Table, {
    foreignKey: 'profileId',
    onQuery: (query) => {
      query.whereNotNull('deleted_at')
    },
  })
  declare allTables: HasMany<typeof Table>

  @hasMany(() => Bartender, {
    foreignKey: 'profileId',
  })
  declare bartenders: HasMany<typeof Bartender>

  @hasMany(() => Cashier, {
    foreignKey: 'profileId',
  })
  declare cashiers: HasMany<typeof Cashier>

  @hasMany(() => Fee, {
    foreignKey: 'profileId',
  })
  declare fees: HasMany<typeof Fee>

  @beforeCreate()
  static setDefaultProps(profile: Profile) {
    profile.showTotal = true
    profile.typeDelivery = 'neighborhood'
    profile.minval = profile.minval ?? 0
    profile.minvalLocal = profile.minvalLocal ?? 0
    profile.description = profile.description ?? 'O melhor da cidade... Peça já o seu!'

    profile.taxDelivery = []
    profile.address = {
      city: '',
      complement: '',
      neigborhood: '',
      number: '',
      state: '',
      street: '',
      zipcode: '',
    }

    profile.formsPayment = [
      {
        status: true,
        payment: 'money',
        label: 'Dinheiro',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        flags: [],
        status: true,
        payment: 'credit',
        label: 'Crédito',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        flags: [],
        status: true,
        payment: 'debit',
        label: 'Débito',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        flags: [],
        status: false,
        payment: 'snack',
        label: 'Vale Alimentação',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        flags: [],
        status: false,
        payment: 'food',
        label: 'Vale Refeição',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        key: { type: '', value: '' },
        status: false,
        payment: 'pix',
        label: 'Pix',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
      {
        key: { type: 'email', value: '' },
        status: false,
        payment: 'picpay',
        label: 'PicPay',
        addon: { status: false, type: 'discount', value: 0, valueType: 'fixed' },
      },
    ]

    profile.week = generateWeekDisponibility()

    profile.options = generateProfileDefaultOptions(profile)
  }

  @beforeSave()
  static setAsaasMinValues(profile: Profile) {
    if (profile.options.asaas) {
      profile.minval = Math.max(Number(profile.minval), env.get('ASAAS_MIN_VALUE'))
      profile.minvalLocal = Math.max(Number(profile.minvalLocal), env.get('ASAAS_MIN_VALUE'))
      if (profile.options.package) {
        profile.options.package.minValue = Math.max(
          Number(profile.options.package?.minValue || 0),
          env.get('ASAAS_MIN_VALUE')
        )
        profile.options.package.minValueLocal = Math.max(
          Number(profile.options.package?.minValueLocal || 0),
          env.get('ASAAS_MIN_VALUE')
        )
      }
    }
  }

  @beforeSave()
  static setDefaultQueues(profile: Profile) {
    if (!profile.options.hasOwnProperty('queues')) {
      profile.options.queues = { bartender: [] }
    }
  }

  @beforeSave()
  static setDefaultAddon(profile: Profile) {
    profile.formsPayment.forEach((formPayment) => {
      if (!formPayment.hasOwnProperty('addon')) {
        formPayment.addon = {
          status: false,
          type: 'fee',
          value: 0,
          valueType: 'fixed',
        }
      }
    })
  }

  @beforeSave()
  static packageMinValuesToFloat(profile: Profile) {
    if (profile.options.package) {
      profile.options.package.minValue = Number.parseFloat(
        profile.options.package.minValue.toFixed(2)
      )
      profile.options.package.minValueLocal = Number.parseFloat(
        profile.options.package.minValueLocal.toFixed(2)
      )
    }
  }

  @afterFind()
  static sortSpecialDates(profile: Profile) {
    profile.options.package?.specialsDates.sort((a, b) => {
      if (a < b) {
        return -1
      } else if (a > b) {
        return 1
      } else {
        return 0
      }
    })
  }

  @afterFetch()
  static sortSpecialDatesFetch(profiles: Profile[]) {
    profiles.forEach((profile) => {
      profile.options.package?.specialsDates.sort((a, b) => {
        if (a < b) {
          return -1
        } else if (a > b) {
          return 1
        } else {
          return 0
        }
      })
    })
  }

  @afterFind()
  @afterFetch()
  @afterPaginate()
  static async firstCupomMessage(result: Profile | Profile[]) {
    if (Array.isArray(result)) {
      for (const profile of result) {
        await cupomFirstMessageReplace(profile)
      }
    } else {
      await cupomFirstMessageReplace(result)
    }
  }

  @afterFind()
  @afterFetch()
  @afterPaginate()
  static async voucherOptions(result: Profile | Profile[]) {
    if (Array.isArray(result)) {
      for (const profile of result) {
        if (!profile.options.voucher) {
          profile.options.voucher = [
            {
              status: false,
              expirationDays: 20,
              percentage: 10,
              created_at: DateTime.local().setLocale('pt-br').toISO(),
            },
          ]
        }
        profile.save()
      }
    } else {
      if (!result.options.voucher) {
        result.options.voucher = [
          {
            status: false,
            expirationDays: 20,
            percentage: 10,
            created_at: DateTime.local().setLocale('pt-br').toISO(),
          },
        ]
        result.save()
      }
    }
  }

  @afterFind()
  @afterFetch()
  @afterPaginate()
  static async storeOptions(result: Profile | Profile[]) {
    if (Array.isArray(result)) {
      for (const profile of result) {
        if (!profile.options.store) {
          profile.options.store = {
            catalogMode: {
              delivery: false,
              table: false,
            },
            productModal: {
              infoPosition: 'last',
            },
          }
        }
        profile.save()
      }
    } else {
      if (!result.options.store?.catalogMode) {
        result.options.store = {
          catalogMode: {
            delivery: false,
            table: false,
          },
          productModal: {
            infoPosition: 'last',
          },
        }
        result.save()
      }
    }
  }
}
