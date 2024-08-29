import { LinkProps } from 'next/link'
import { CartType } from '../types/cart'
import Profile, { ProfileType } from '../types/profile'

export const useWhatsAppBot = () => {
  const sendMessage = (contact: string, message: string, client?: any) => {
    if ('WhatsAppBotApi' in window) {
      ;(window.WhatsAppBotApi as any).sendMessage(contact, message, client)
    }
  }

  const storeProfile = (profile: ProfileType | Profile) => {
    if ('DesktopApi' in window) {
      if (profile instanceof Profile || Object.values(profile).some((value) => typeof value === 'function')) {
        profile = JSON.parse(JSON.stringify(profile))
      }
      ;(window.DesktopApi as any).storeProfile(profile)
    }
  }

  const onMessageSend = (callback: (args: any) => void) => {
    if ('WhatsAppBotApi' in window) {
      ;(window.WhatsAppBotApi as any)?.onmessagesend((_: any, client: any) => {
        callback(client)
      })
    }
  }

  const onCart = (cart: CartType) => {
    if ('DesktopApi' in window) {
      ;(window.DesktopApi as any)?.onCart(cart)
    }
  }

  /**
   * Abre um link no navegador padrão.
   *
   * @param {React.MouseEvent<LinkProps, MouseEvent>} link - O link a ser aberto.
   * @return {void}
   */
  const openLink = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
    if ('DesktopApi' in window) {
      event.preventDefault()
      ;(window.DesktopApi as any)?.openLink(event.currentTarget.href)
    }
  }

  return {
    sendMessage,
    storeProfile,
    onMessageSend,
    onCart,
    openLink,
  }
}
