import Profile from '#models/profile'

/**
 * Replaces the placeholder "[NOME]" in the `cupomFirstMessage` option of the given `profile` with the code of the first cupom in the `firstOnlyCupom` relation.
 *
 * @param {Profile} profile - The profile object whose `cupomFirstMessage` option will be modified.
 * @return {Promise<void>} A promise that resolves when the `cupomFirstMessage` option has been updated.
 */
export const cupomFirstMessageReplace = async (profile: Profile): Promise<void> => {
  try {
    await profile.load('firstOnlyCupom')
    if (profile.options.placeholders && profile.firstOnlyCupom) {
      profile.options.placeholders.cupomFirstMessage = `${profile.options.placeholders.cupomFirstMessage ?? `Olá *[NOME]!*\n\nSeja bem vindo ao ${profile.name}\n\nÉ sua primeira vez aqui, separei um cupom especial para você`}\n\nhttps://www.whatsmenu.com.br/${profile.slug}?firstOnlyCupom=${profile.firstOnlyCupom.code}\n\n 👆🏻 Cupom: *${profile.firstOnlyCupom.code}* 👆🏻 \n\nClique no link para fazer o pedido com o cupom`
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}
