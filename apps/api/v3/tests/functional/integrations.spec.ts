import { UserFactory } from '#database/factories/user_factory'
import { ProfileOptions } from '#interfaces/profile'
import Profile from '#models/profile'
import User from '#models/user'
import { test } from '@japa/runner'
import sinon from 'sinon'

test.group('Integrations', (group) => {
  let user: User | null
  group.setup(async () => {
    user = await UserFactory.with('profile', 1).create()
    await user?.load('profile')
  })
  test('Deve ser possível salvar o Pixel do facebook', async ({ assert, client }) => {
    try {
      const body: Pick<ProfileOptions['tracking'], 'pixel'> = { pixel: '000000000000000' }
      const result = await client
        .post('/dashboard/integrations/facebookPixel')
        .json(body)
        .loginAs(user!)
      result.assertStatus(200)
      assert.equal(result.body().profile.options.tracking.pixel, body.pixel)
    } catch (error) {
      throw error
    }
  })
  test('Deve disparar uma exceção caso algo inesperado aconteça ao salvar o Pixel do facebook', async ({
    client,
  }) => {
    const body: Pick<ProfileOptions['tracking'], 'pixel'> = { pixel: '000000000000000' }
    const modelStub = sinon.stub(Profile.prototype, 'load').throws()
    let result
    try {
      result = await client.post('/dashboard/integrations/facebookPixel').json(body).loginAs(user!)
    } catch (error) {
      result?.assertStatus(500)
    } finally {
      modelStub.restore()
    }
  })
  test('Deve disparar uma exceção caso o número de caracteres do pixel seja diferente de 15', async ({
    client,
  }) => {
    const body: Pick<ProfileOptions['tracking'], 'pixel'> = { pixel: '00' }
    let result
    try {
      result = await client.post('/dashboard/integrations/facebook').json(body).loginAs(user!)
    } catch (error) {
      console.log('error')

      result?.assertStatus(422)
    }
  })
  test('Deve ser possível salvar o Google Tag Manager e o Google ADS', async ({
    assert,
    client,
  }) => {
    try {
      const body: Pick<ProfileOptions['tracking'], 'google' | 'googleAds'> = {
        google: 'GTM-XXXXXX',
        googleAds: {
          id: 'AW-0000000000',
          label: 'label',
        },
      }
      const result = await client.post('/dashboard/integrations/google').json(body).loginAs(user!)
      result.assertStatus(200)
      assert.equal(result.body().profile.options.tracking.google, body.google)
      assert.deepEqual(result.body().profile.options.tracking.googleAds, body.googleAds)
    } catch (error) {
      console.error(error)
      throw error
    }
  })
  test('Deve disparar uma exceção caso algo inesperado aconteça ao salvar o Google Tag Manager e o Google ADS', async ({
    client,
  }) => {
    const body: Pick<ProfileOptions['tracking'], 'google' | 'googleAds'> = {
      google: '000000000000000',
      googleAds: {
        id: '000000000000000',
        label: 'label',
      },
    }
    const modelStub = sinon.stub(Profile.prototype, 'load').throws()
    let result
    try {
      result = await client.post('/dashboard/integrations/google').json(body).loginAs(user!)
    } catch (error) {
      result?.assertStatus(500)
    } finally {
      modelStub.restore()
    }
  })
  test('Deve disparar uma exceção caso o número de caracteres do pixel seja diferente de 15', async ({
    client,
  }) => {
    let result
    try {
      const body: Pick<ProfileOptions['tracking'], 'google' | 'googleAds'> = {
        google: '0000000',
        googleAds: {
          id: 'teste 00000',
          label: 'label',
        },
      }
      result = await client.post('/dashboard/integrations/google').json(body).loginAs(user!)
    } catch (error) {
      result?.assertStatus(422)
      throw error
    }
  })
})
