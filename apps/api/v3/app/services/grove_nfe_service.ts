import Cart from '#models/cart'
import Profile from '#models/profile'
import { DateTime } from 'luxon'

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
    console.log('companyService', company)

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

  /**
   * Adiciona uma nota fiscal ao carrinho.
   *
   * @param {string} external_id - ID externo do carrinho.
   * @param {object} fiscalNote - Objeto da nota fiscal.
   *
   * @returns {Promise<void>}
   */
  async addFiscalNoteToCart({ fiscal_note }: { fiscal_note: any }): Promise<boolean> {
    try {
      const cart = await Cart.find(fiscal_note.external_id)
      if (cart) {
        cart.controls.grovenfe = { fiscal_note }
        await cart.save()
        return true
      } else {
        return false
      }
    } catch (error) {
      throw error
    }
  }

  async deleteFiscalNoteFromCart({ fiscal_note }: { fiscal_note: any }): Promise<void> {
    try {
      const cart = await Cart.find(fiscal_note.external_id)
      if (cart && cart.controls?.grovenfe?.fiscal_note) {
        cart.controls.grovenfe.fiscal_note.deleted_at = DateTime.local().toISO()
        await cart.save()
      }
    } catch (error) {
      throw error
    }
  }
}
