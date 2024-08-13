'use strict'

const Profile = use('App/Models/Profile')

class ProfileCheckExist {
  async handle({ params, response }, next) {
    // call next to advance the request
    try {
      const { slug } = params
      const profile = await Profile.findBy('slug', slug)
      if (!profile) {
        return response.status(404).json({ message: 'Perfil não encontrado' })
      }
      params.profile = profile
    } catch (error) {
      console.error(error)
      throw error
    }
    await next()
  }
}

module.exports = ProfileCheckExist
