'use strict'

const { DateTime } = require('luxon')
const Database = use('Database')

const Motoboy = use('App/Models/Motoboy')
const MotoboyR = use('App/Models/ReadOnly/Motoboy')
const UserR = use('App/Models/ReadOnly/User')

class MotoboyController {
  async index({ auth, request, response }) {
    // Listar todos os motoboys
    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const motoboys = await profile.motoboys().fetch()

    return response.json({ motoboys })
  }

  async report({ auth, request, response, params }) {
    try {
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()
      const { page } = params
      const { startDate, endDate, motoboyId } = request.all()
      const realEndDate = DateTime.fromISO(endDate).plus({ day: 1 })
      const motoboy = await profile.motoboys().where({ id: motoboyId }).first()
      if (!motoboy) {
        return response.status(404).json({ message: 'Motoboy não encontrado' })
      }
      const carts = await motoboy
        .carts()
        .with('client')
        .where((whereBuilder) => {
          whereBuilder
            .andWhere((nestedBuilder) => {
              nestedBuilder.where('type', 'D').whereBetween('created_at', [startDate, realEndDate.toISO()])
            })
            .orWhere((nestedBuilder) => {
              nestedBuilder.where('type', 'P').whereBetween('packageDate', [startDate, realEndDate.toISO()])
            })
        })
        .orderBy('created_at', 'desc')
        .paginate(page, 50)
      const motoboyResponse = { ...motoboy.toJSON(), carts: carts.toJSON() }

      return response.json({ motoboy: motoboyResponse })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // Calcula o total de entregas e taxas de entrega
  async resume({ auth, request, response, params }) {
    try {
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()
      const { startDate, endDate, motoboyId } = request.all()
      const realEndDate = DateTime.fromISO(endDate).plus({ day: 1 })
      const motoboy = await profile.motoboys().where({ id: motoboyId }).first()
      if (!motoboy) {
        return response.status(404).json({ message: 'Motoboy não encontrado' })
      }
      const carts = await motoboy
        .carts()
        .where((whereBuilder) => {
          whereBuilder
            .andWhere((nestedBuilder) => {
              nestedBuilder.where('type', 'D').whereBetween('created_at', [startDate, realEndDate.toISO()])
            })
            .orWhere((nestedBuilder) => {
              nestedBuilder.where('type', 'P').whereBetween('packageDate', [startDate, realEndDate.toISO()])
            })
        })
        .count('* as total')
        .sum('taxDelivery as sumTaxDelivery')
      return response.json({ ...carts[0] })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // Criar um novo motoboy
  async store({ request, response }) {
    try {
      const motoboyData = request.only(['name', 'profileId', 'status', 'controls', 'whatsapp'])
      const motoboy = await Motoboy.create(motoboyData)
      return response.status(201).json(motoboy)
    } catch (error) {
      console.error('Erro ao criar motoboy', error)
      return response.status(500).json({ message: 'Erro ao criar motoboy.' })
    }
  }

  // Buscar um motoboy pelo ID
  async show({ params, response }) {
    try {
      const motoboy = await MotoboyR.find(params.id)
      return response.status(201).json(motoboy)
    } catch (error) {
      console.error('Error ao buscar motoboy', error)
      return response.status(500).json({ message: 'Erro ao buscar motoboy.' })
    }
  }

  // Atualizar um motoboy pelo ID
  async update({ params, request, response }) {
    try {
      const motoboy = await Motoboy.find(params.id)
      const motoboyData = request.only(['name', 'profileId', 'status', 'controls', 'whatsapp'])
      motoboy.merge(motoboyData)
      await motoboy.save()
      return response.json(motoboy)
    } catch (error) {
      console.error('Error ao atualizar motoboy', error)
      return response.status(500).json({ message: 'Erro ao atualizar motoboy.' })
    }
  }

  // Excluir um motoboy pelo ID (exclusão lógica)
  async destroy({ params, response }) {
    try {
      const motoboy = await Motoboy.find(params.id)
      motoboy.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      await motoboy.save()
      return response.json({ message: 'Motoboy excluído com sucesso.' })
    } catch (error) {
      console.error('Error ao excluir motoboy', error)
      return response.status(500).json({ message: 'Erro ao excluir motoboy.' })
    }
  }
}

module.exports = MotoboyController
