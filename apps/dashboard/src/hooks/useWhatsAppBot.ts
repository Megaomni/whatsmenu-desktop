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
      if (profile instanceof Profile) {
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

  return {
    sendMessage,
    storeProfile,
    onMessageSend,
    onCart,
  }
}
