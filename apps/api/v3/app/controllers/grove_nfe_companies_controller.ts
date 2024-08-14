import type { HttpContext } from '@adonisjs/core/http'
import GroveNfeService from '#services/grove_nfe_service'

export default class GroveNfeCompaniesController {
  constructor(protected groveNfeService: GroveNfeService) {}

  async create({ request, response }: HttpContext) {
    try {
      const { body } = request.all()
      const { createdCompany } = await this.groveNfeService.createCompany({ body })

      return response.status(201).json({ createdCompany })
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async update({ request, response }: HttpContext) {
    try {
      const { company } = request.all()
      const { updatedCompany } = await this.groveNfeService.updateCompany({ company })

      return response.json({ updatedCompany })
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const { id } = params
      const { company } = await this.groveNfeService.showCompany({ id })

      return response.json({ company })
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async delete({ params, response }: HttpContext) {
    try {
      const { id } = params
      const { deletedCompany } = await this.groveNfeService.deleteCompany({ id })

      return response.json({ deletedCompany })
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async showAllCompanies({ response }: HttpContext) {
    try {
      const { companies } = await this.groveNfeService.showAllCompanies()

      return response.json({ companies })
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }
}
