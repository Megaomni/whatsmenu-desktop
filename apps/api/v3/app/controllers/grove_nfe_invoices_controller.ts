import type { HttpContext } from '@adonisjs/core/http'
import GroveNfeService from '#services/grove_nfe_service'

export default class GroveNfeInvoicesController {
  constructor(protected groveNfeService: GroveNfeService) {}

  async list({ response, params }: HttpContext) {
    try {
      const { comapny_id } = params

      const { invoices } = await this.groveNfeService.showAllInvoices({ comapny_id })

      return response.send({ invoices })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao listar Boletos')
    }
  }

  async show({ response, params }: HttpContext) {
    try {
      const { id } = params

      const { invoice } = await this.groveNfeService.showInvoice({ id })

      return response.send({ invoice })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao consultar uma NFCe')
    }
  }
}
