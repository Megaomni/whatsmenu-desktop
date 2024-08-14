import type { HttpContext } from '@adonisjs/core/http'
import GroveNfeService from '#services/grove_nfe_service'

export default class GroveNfeFiscalNotesController {
  constructor(protected groveNfeService: GroveNfeService) {}

  async create({ request, response, params }: HttpContext) {
    try {
      const { nfce } = request.all()
      const { id } = params

      const { createdFiscalNote } = await this.groveNfeService.createFiscalNote({ nfce, id })

      return response.status(201).json({ createdFiscalNote })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao criar NFCe')
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const { id } = params

      const { fiscalNote } = await this.groveNfeService.showFiscalNote({ id })

      return response.json({ fiscalNote })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao consultar uma NFCe')
    }
  }

  async cancel({ request, params, response }: HttpContext) {
    try {
      const { id } = params
      const { justification } = request.all()

      const { deletedFiscalNote } = await this.groveNfeService.cancelFiscalNote({
        id,
        justification,
      })

      return response.json({ deletedFiscalNote })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao deletar uma NFCe')
    }
  }

  async disenableNFCe({ request, params, response }: HttpContext) {
    try {
      const { id } = params
      const { disenable } = request.all()

      const { disabledFiscalNote } = await this.groveNfeService.disenableNFCe({
        id,
        disenable,
      })

      return response.json({ disabledFiscalNote })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao inutilizar uma NFCe')
    }
  }

  async SendCopyForEmail({ request, params, response }: HttpContext) {
    try {
      const { id } = params
      const { emails } = request.all()

      const { sendCopyForEmail } = await this.groveNfeService.SendCopyForEmail({
        id,
        emails,
      })

      return response.json({ sendCopyForEmail })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao enviar NFCe para email')
    }
  }

  async showAll({ params, response }: HttpContext) {
    try {
      const { comapny_id } = params

      const { fiscalNotes } = await this.groveNfeService.showAllFiscalNotes({ comapny_id })

      return response.json({ fiscalNotes })
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao pegar todas as NFCe')
    }
  }
}
