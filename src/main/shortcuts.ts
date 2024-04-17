import { BrowserWindow, globalShortcut } from "electron"

export const registerShortCuts = (window: BrowserWindow) => {
  window.on('focus', () => {
    globalShortcut.register('F5', () => window.reload())
  })

  window.on('blur', () => {
    globalShortcut.unregisterAll()
  })
}