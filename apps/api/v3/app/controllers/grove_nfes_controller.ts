import GroveNfeService from '#services/grove_nfe_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { convertToFocusNfce } from '@whatsmenu/utils'

@inject()
export default class GroveNfesController {
  constructor(protected groveNfeService: GroveNfeService) {}
  async webhook({ request, response }: HttpContext) {
    try {
      const { event, data } = request.all()

      let fiscal_note
      switch (event) {
        case 'COMPANY_CREATED':
        case 'COMPANY_UPDATED':
          const { company } = data
          console.log('companyController', data)
          await this.groveNfeService.updateProfile({ company })
          break
        case 'FISCAL_NOTE_UPDATED':
        case 'FISCAL_NOTE_CREATED':
          console.log('GROVE NFE WEBHOOK', data)
          fiscal_note = data.fiscal_note
          await this.groveNfeService.addFiscalNoteToCart({ fiscal_note })
          break
        case 'FISCAL_NOTE_CANCELLED':
          fiscal_note = data.fiscal_note
          await this.groveNfeService.deleteFiscalNoteFromCart({ fiscal_note })
          break
        default:
          break
      }
      return response.json({ success: true, message: 'Evento recebido', fiscal_note })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

  async convertToFocusNote({ request, response }: HttpContext) {
    const { cart, company } = request.all()

    try {
      const focus_note = convertToFocusNfce({ cart, groveNfeCompany: company })

      return response.json({ focus_note })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
