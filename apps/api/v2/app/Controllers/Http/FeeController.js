'use strict'

const moment = require("moment")

const Fee = use('App/Models/Fee')

class FeeController {
  async store({ auth, request, response }) {
    try {
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])
      let fees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()
      fees = fees.toJSON()

      data.profileId = profile.id

      const haveFee = fees.find(fee => fee.code.trim() === data.code.trim())

      if (haveFee) {
        return response.status(400).json({ message: 'Ja existe uma taxa com esse mesmo nome!' })
      }

      const fee = await Fee.create(data)

      return response.json(fee)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async delete({ request, response }) {
    try {
      const data = request.except(['_csrf'])

      const fee = await Fee.find(data.fee.id)

      fee.deleted_at = moment().format()
      fee.code += fee.deleted_at
      fee.status = 0

      await fee.save()

      return response.json(fee)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async update({ request, response }) {
    try {
      const data = request.except(['_csrf'])
      const { id, type } = data

      const fee = await Fee.find(id)

      if (type === 'status') {
        fee.status = fee.status === 1 ? 0 : 1
      }

      if (type === 'automatic') {
        fee.automatic = fee.automatic === 1 ? 0 : 1
      }

      await fee.save()

      return response.json(fee)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getFees({ auth, response }) {
    try {
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      let fees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()

      return response.json(fees)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

}

module.exports = FeeController
