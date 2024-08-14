import env from '#start/env'
import axios from 'axios'

export default class GroveNfeService {
  groveNfeUrl: any
  constructor() {
    this.groveNfeUrl = axios.create({
      baseURL: env.get('GROVE_NFE_ENDPOINT'),
      headers: {
        Authorization: `Bearer ${env.get('GROVE_NFE_TOKEN')}`,
      },
    })
  }

  async createCompany({ body }: any) {
    try {
      const { data: createdCompany } = await this.groveNfeUrl.post('/v1/companies', body)

      return { createdCompany }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao criar Empresa')
    }
  }

  async updateCompany({ company }: any) {
    try {
      const { data: updatedCompany } = await this.groveNfeUrl.put(`/v1/companies`, company)

      return { updatedCompany }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao atualizar Empresa')
    }
  }

  async showCompany({ id }: { id: number }) {
    try {
      const { data: company } = await this.groveNfeUrl.get(`/v1/companies/${id}`)

      return { company }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao consultar uma Empresa')
    }
  }

  async deleteCompany({ id }: { id: number }) {
    try {
      const { data: deletedCompany } = await this.groveNfeUrl.delete(`/v1/companies/${id}`)

      return { deletedCompany }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao deletar uma Empresa')
    }
  }

  async showAllCompanies() {
    try {
      const { data: companies } = await this.groveNfeUrl.get('/v1/companies')

      return { companies }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao pegar todas as Empresa')
    }
  }

  async createFiscalNote({ nfce, id }: any) {
    try {
      const { data: createdFiscalNote } = await this.groveNfeUrl.post(`/v1/fiscalNotes/${id}`, nfce)

      return { createdFiscalNote }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao criar NFCe')
    }
  }

  async showFiscalNote({ id }: { id: number }) {
    try {
      const { data: fiscalNote } = await this.groveNfeUrl.get(`/v1/fiscalNotes/${id}`)

      return { fiscalNote }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao consultar uma NFCe')
    }
  }

  async cancelFiscalNote({ id, justification }: { id: number; justification: any }) {
    try {
      const { data: deletedFiscalNote } = await this.groveNfeUrl.delete(
        `/v1/fiscalNotes/${id}`,
        justification
      )

      return { deletedFiscalNote }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao deletar uma NFCe')
    }
  }

  async disenableNFCe({ id, disenable }: { id: number; disenable: any }) {
    try {
      const { data: disabledFiscalNote } = await this.groveNfeUrl.put(
        `/v1/fiscalNotes/disable/${id}`,
        disenable
      )

      return { disabledFiscalNote }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao inutilizar uma NFCe')
    }
  }

  async SendCopyForEmail({ id, emails }: { id: number; emails: string[] }) {
    try {
      const { data: sendCopyForEmail } = await this.groveNfeUrl.post(
        `/v1/fiscalNotes/sendCopy/${id}`,
        emails
      )

      return { sendCopyForEmail }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao enviar NFCe para email')
    }
  }

  async showAllFiscalNotes({ comapny_id }: { comapny_id: number }) {
    try {
      const { data: fiscalNotes } = await this.groveNfeUrl.get(
        `/v1/fiscalNotes/showAll/${comapny_id}`
      )

      return { fiscalNotes }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao pegar todas as NFCe')
    }
  }

  async showAllInvoices({ comapny_id }: { comapny_id: number }) {
    try {
      const { data: invoices } = await this.groveNfeUrl.get(`/v1/invoices/list/${comapny_id}`)

      return { invoices }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao listar Boletos')
    }
  }

  async showInvoice({ id }: { id: number }) {
    try {
      const { data: invoice } = await this.groveNfeUrl.get(`/v1/invoices/${id}`)

      return { invoice }
    } catch (error) {
      console.error(error.response.data)
      throw new Error('Erro ao consultar uma NFCe')
    }
  }
}
