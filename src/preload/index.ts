// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";
import WAWebJS from "whatsapp-web.js";

// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


export const WhatsAppBotApi = {
  // Events
  onqrcode: (callback: (event: Electron.IpcRendererEvent, qrcode: string) => void) => ipcRenderer.on('onqrcode', callback),
  onloading: (callback: (event: Electron.IpcRendererEvent, value: { percent: number, message: string }) => void) => ipcRenderer.on('onloading', callback),
  onready: (callback: (event: Electron.IpcRendererEvent) => void) => ipcRenderer.on('onready', callback),
  ondisconnected: (callback: (event: Electron.IpcRendererEvent, reason: WAWebJS.WAState | "NAVIGATION") => void) => ipcRenderer.on('ondisconnected', callback),

  // Methods
  sendMessage: (contact: string, message: string) => ipcRenderer.send('send-message', { contact, message }),
  showWhatsapp: (show: boolean) => ipcRenderer.send('show-whatsapp', show),
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

ipcRenderer.on('warn', (event, error) => {
  console.warn(error);
})