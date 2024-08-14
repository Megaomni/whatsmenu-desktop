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
      throw error
    }
  }

  async updateCompany({ company }: any) {
    try {
      const { data: updatedCompany } = await this.groveNfeUrl.put(`/v1/companies`, company)

      return { updatedCompany }
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async showCompany({ id }: { id: number }) {
    try {
      const { data: company } = await this.groveNfeUrl.get(`/v1/companies/${id}`)

      return { company }
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async deleteCompany({ id }: { id: number }) {
    try {
      const { data: deletedCompany } = await this.groveNfeUrl.delete(`/v1/companies/${id}`)

      return { deletedCompany }
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }

  async showAllCompanies() {
    try {
      const { data: companies } = await this.groveNfeUrl.get('/v1/companies')

      return { companies }
    } catch (error) {
      console.error(error.response.data)
      throw error
    }
  }
}
