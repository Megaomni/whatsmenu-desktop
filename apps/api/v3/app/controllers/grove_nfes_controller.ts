import GroveNfeService from '#services/grove_nfe_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { convertToFocusNfce } from '@whatsmenu/utils/src/convert-to-focus-nfce.js'

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

  async convertToFocusNote({ request, response }: HttpContext) {
    const { cart, user } = request.all()

    try {
      const focusNote = convertToFocusNfce({ cart, user })

      return response.json({ focusNote })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
