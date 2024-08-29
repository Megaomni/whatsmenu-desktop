import { DateTime } from 'luxon'
import { withAuthFinder } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { UserControls } from '#types/user'
import type { BelongsTo, HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'
import BonusSupport from './bonus_support.js'
import Token from './token.js'
import Plan from './plan.js'
import SystemRequest from './system_request.js'
import FlexPlan from './flex_plan.js'
import Invoice from './invoice.js'
import Seller from './seller.js'
import { AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { jsonSerialize } from '#utils/json_serialize'
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'secretNumber' })
  declare secretNumber: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare whatsapp: string

  @column({ serializeAs: null })
  declare password: string

  @column({ serializeAs: null })
  declare security_key: string | null

  @column()
  declare sellerId: number | null

  @column()
  declare supportId: number | null

  @column()
  declare planId: number | null

  @column()
  declare due: number | null

  @column({
    consume: (controls) => {
      controls = jsonSerialize(controls)
      controls.attempts = controls.attempts ?? 0
      return controls
    },
    prepare: (controls) => {
      return JSON.stringify(controls)
    },
  })
  declare controls: UserControls

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @hasOne(() => Profile, {
    foreignKey: 'userId',
  })
  declare profile: HasOne<typeof Profile>

  @hasMany(() => Profile, {
    foreignKey: 'userId',
  })
  declare profiles: HasMany<typeof Profile>

  @hasOne(() => BonusSupport, {
    foreignKey: 'userId',
  })
  declare bonusSupport: HasOne<typeof BonusSupport>

  @hasOne(() => User, {
    foreignKey: 'supportId',
  })
  declare support: HasOne<typeof User>

  @hasMany(() => Token)
  declare tokens: HasMany<typeof Token>

  @hasMany(() => SystemRequest, {
    foreignKey: 'userId',
  })
  declare requests: HasMany<typeof SystemRequest>

  @hasMany(() => Invoice, {
    foreignKey: 'userId',
  })
  declare invoices: HasMany<typeof Invoice>

  @belongsTo(() => Plan, {
    localKey: 'planId',
  })
  declare plan: BelongsTo<typeof Plan>

  @belongsTo(() => Seller, {
    localKey: 'sellerId',
  })
  declare seller: BelongsTo<typeof Seller>

  @manyToMany(() => FlexPlan, {
    pivotTable: 'user_plans',
    pivotForeignKey: 'userId',
    pivotRelatedForeignKey: 'flexPlanId',
  })
  declare plans: ManyToMany<typeof FlexPlan>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  currentAccessToken?: AccessToken
}
