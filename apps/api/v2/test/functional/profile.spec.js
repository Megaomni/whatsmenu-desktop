'use strict'

const { DateTime } = require('luxon')
const sinon = require('sinon')

const User = use('App/Models/User')
const Profile = use('App/Models/Profile')

const { test, trait } = use('Test/Suite')('Profile')
trait('Test/ApiClient')
trait('Auth/Client')

test('Não Deve ser possivel adicionar uma nova negociação caso o perfil não tenha um cadastro no asaas', async ({ client }) => {
  const profileFindStub = sinon.stub(Profile, 'find')
  const user = await User.find(20)

  profileFindStub.callsFake(() => {
    return {
      save: async () => {},
      options: {},
    }
  })

  const negotiation = { fee: 0.79, expiration_date: DateTime.local().toFormat('yyyy-MM-dd hh:mm:ss') }
  const response = await client
    .post('/dashboard/profile/addNewPixNegotiationAsaas')
    .loginVia(user)
    .send({ ...negotiation, profileId: 1 })
    .end()

  response.assertStatus(403)
  response.assertJSONSubset({ message: 'Este perfil não possui um cadastro na Asaas' })
  profileFindStub.restore()

  profileFindStub.restore()
})

test('Não Deve ser possivel adicionar uma nova negociação no pix asaas caso ainda tenha uma negociação vigente', async ({ client }) => {
  const profileFindStub = sinon.stub(Profile, 'find')
  const user = await User.find(20)
  profileFindStub.callsFake(() => {
    return {
      save: async () => {},
      options: {
        asaas: {
          negotiation: {
            pix: [negotiation],
          },
        },
      },
    }
  })

  const negotiation = { fee: 0.79, expiration_date: DateTime.local().toFormat('yyyy-MM-dd hh:mm:ss') }
  const response = await client
    .post('/dashboard/profile/addNewPixNegotiationAsaas')
    .loginVia(user)
    .send({ ...negotiation, profileId: 1 })
    .end()

  response.assertStatus(403)
  response.assertJSONSubset({ message: 'A renegociação anterior ainda está em vigor' })
  profileFindStub.restore()
})

test('Deve ser possivel adicionar uma nova negociação no pix asaas', async ({ client }) => {
  const profileFindStub = sinon.stub(Profile, 'find')
  const user = await User.find(20)

  profileFindStub.callsFake(() => {
    return {
      save: async () => {},
      options: {
        asaas: {
          negotiation: {
            pix: [],
          },
        },
      },
    }
  })

  const negotiation = { fee: 0.79, expiration_date: DateTime.local().toFormat('yyyy-MM-dd hh:mm:ss') }
  const response = await client
    .post('/dashboard/profile/addNewPixNegotiationAsaas')
    .loginVia(user)
    .send({ ...negotiation, profileId: 1 })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    pix: [negotiation],
  })
  profileFindStub.restore()
})
