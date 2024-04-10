// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";

// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


export const WhatsAppBotApi = {
  onqrcode: (callback: (event: Electron.IpcRendererEvent, qrcode: string) => void) => ipcRenderer.on('onqrcode', callback),
  onready: (callback: (event: Electron.IpcRendererEvent) => void) => ipcRenderer.on('onready', callback),
  sendMessage: (contact: string, message: string) => ipcRenderer.send('send-message', { contact, message }),
}

const WhatsMenuPrintApi = {
  print: (url: string) => ipcRenderer.send('print', url)
}

contextBridge.exposeInMainWorld('isElectron', true)
contextBridge.exposeInMainWorld('WhatsAppBotApi', WhatsAppBotApi)
contextBridge.exposeInMainWorld('WhatsMenuPrintApi', WhatsMenuPrintApi)

ipcRenderer.on('log', (event, log) => {
  console.log(log);
})

ipcRenderer.on('error', (event, error) => {
  console.error(error);
})
console.log('preload')