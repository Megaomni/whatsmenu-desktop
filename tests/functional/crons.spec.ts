import Voucher from '#models/voucher'
import { test } from '@japa/runner'

test.group('Crons', () => {
  test('Deve ser possível cancelar todos os vouchers expirados', async ({ client, assert }) => {
    const response = await client.get('/cron/cancelExpiredVouchers')
    response.assertStatus(200)
    assert.isTrue(response.body().vouchers.every((v: Voucher) => v.status === 'cancelled'))
  })
})
