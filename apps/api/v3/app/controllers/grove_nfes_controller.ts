import GroveNfeService from '#services/grove_nfe_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class GroveNfesController {
  constructor(protected groveNfeService: GroveNfeService) {}
  async webhook({ request, response }: HttpContext) {
    const { event, data } = request.all()

    try {
      switch (event) {
        case 'COMPANY_CREATED':
        case 'COMPANY_UPDATED':
          const { company } = data
          console.log('companyController', data)
          this.groveNfeService.updateProfile({ company })
          break
        case 'FISCAL_NOTE_CREATED':
          const { fiscal_note } = data
          this.groveNfeService.addFiscalNoteToCart({ fiscal_note })
          break
      }
      return response.json({ success: true, message: 'Evento recebido' })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }
}
