import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import GroveNfeService from '#services/grove_nfe_service'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Grove Nfe Service', (group) => {
  const groveNfeService = new GroveNfeService()
  let user: User

  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user.load('profile')
  })
  test('Deve ser possível atualizar as integrações Grove Nfe', async ({ assert }) => {
    const company = {
      id: 1,
      external_id: String(user.profile.id),
      controls: {
        fiscal_notes: {
          day_limiter: 1,
          forms_payments: [{ type: 'money' }],
          nfce: true,
          nfe: false,
        },
      },
      created_at: DateTime.local().toISO(),
    }

    try {
      await groveNfeService.updateProfile({
        company,
      })

      await user.load('profile')
      user.profile.options
      assert.deepEqual(
        user.profile.options.integrations?.grovenfe?.config.fiscal_notes,
        company.controls.fiscal_notes
      )
      assert.deepEqual(user.profile.options.integrations.grovenfe?.company_id, company.id)
      assert.deepEqual(user.profile.options.integrations.grovenfe?.created_at, company.created_at)
    } catch (error) {
      throw error
    }
  })
})
