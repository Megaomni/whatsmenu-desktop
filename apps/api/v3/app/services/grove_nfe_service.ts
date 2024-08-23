import Profile from '#models/profile'

export default class GroveNfeService {
  constructor() {}

  /**
   * Atualiza as informações de NF-e do perfil.
   *
   * @param {object} company - Objeto com as informa es da empresa,
   *                          como o id, external_id e controls.
   *
   * @returns {Promise<void>}
   */
  async updateProfile({ company }: { company: any }): Promise<void> {
    const profile = await Profile.find(company.external_id)
    if (profile) {
      profile.options.integrations = {
        ...profile.options.integrations,
        grovenfe: {
          config: {
            fiscal_notes: company.controls.fiscal_notes,
          },
          plan: company.plan,
          company_id: Number(company.id),
          created_at: company.created_at,
        },
      }
      await profile.save()
    }
  }
}
