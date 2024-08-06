import { CashierFactory } from '#database/factories/cashier_factory'
import { UserFactory } from '#database/factories/user_factory'
import { VoucherFactory } from '#database/factories/voucher_factory'
import sinon from 'sinon'
import User from '#models/user'
import Voucher from '#models/voucher'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Cashier from '#models/cashier'

test.group('Crons', (group) => {
  let user: User | null

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user?.load('profile')
  })

  // CRON VOUCHERS
  test('Deve ser possível cancelar todos os vouchers expirados', async ({ client, assert }) => {
    try {
      const vouchers = await VoucherFactory.merge({
        expirationDate: DateTime.local().minus({ days: 1 }),
        profileId: user!.profile.id,
        status: 'avaliable',
      }).createMany(5)
      const response = await client.get('/cron/cancelExpiredVouchers')
      response.assertStatus(200)

      for (const voucher of vouchers) {
        await voucher.refresh()
        assert.equal(voucher.status, 'cancelled')
      }
      const responseBody = response.body()
      assert.equal(responseBody.vouchers.length, 5)
      assert.isTrue(responseBody.vouchers.every((v: Voucher) => v.status === 'cancelled'))
    } catch (error) {
      throw error
    }
  })

  test('Deve retornar ERROR ao cancelar vouchers expirados se ocorrer uma excessão', async ({
    client,
    assert,
  }) => {
    const voucherStub = sinon.stub(Voucher, 'query').throws()
    let response
    try {
      response = await client.get('/cron/cancelExpiredVouchers')
    } catch (error) {
      response?.assertStatus(500)
      response?.assertBody({ message: 'Failed to cancel expired vouchers.' })
    } finally {
      voucherStub.restore()
    }
  })

  // CRON CASHIERS
  test('Deve ser possível fechar todos os caixas abertos há mais de dois dias', async ({
    client,
    assert,
  }) => {
    try {
      const cashiers = await CashierFactory.merge({
        profileId: user!.profile.id,
        created_at: DateTime.local().minus({ days: 2 }),
      }).createMany(5)
      const response = await client.get('/cron/closeCashiers')
      response.assertStatus(200)
      assert.equal(response.body().cashiers.length, cashiers.length)
    } catch (error) {
      throw error
    }
  })

  test('Deve retornar ERROR ao fechar caixas se ocorrer uma excessão', async ({ client }) => {
    const cashierStub = sinon.stub(Cashier, 'query').throws()
    let response
    try {
      response = await client.get('/cron/closeCashiers')
    } catch (error) {
      response?.assertStatus(500)
      response?.assertBody({ message: 'Failed to close cashiers.' })
    } finally {
      cashierStub.restore()
    }
  })
})
