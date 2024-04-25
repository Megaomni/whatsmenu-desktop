// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";
import { ClientType } from "../@types/client";
import WAWebJS from "whatsapp-web.js";
import { ProfileType } from "../@types/profile";

// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


export const WhatsAppBotApi = {
  // Events
  onqrcode: (callback: (event: Electron.IpcRendererEvent, qrcode: string) => void) => ipcRenderer.on('onqrcode', callback),
  onloading: (callback: (event: Electron.IpcRendererEvent, value: { percent: number, message: string }) => void) => ipcRenderer.on('onloading', callback),
  onready: (callback: (event: Electron.IpcRendererEvent) => void) => ipcRenderer.on('onready', callback),
  ondisconnected: (callback: (event: Electron.IpcRendererEvent, reason: WAWebJS.WAState | "NAVIGATION") => void) => ipcRenderer.on('ondisconnected', callback),
  onmessagesend: (callback: (event: Electron.IpcRendererEvent, client: ClientType) => void) => ipcRenderer.once('onmessagesend', callback),

  // Methods
  sendMessage: (contact: string, message: string, client?: ClientType) => ipcRenderer.send('send-message', { contact, message, client }),
  showWhatsapp: (show: boolean) => ipcRenderer.send('show-whatsapp', show),
  setExecutablePath: (executablePath: string) => { 
    ipcRenderer.send('executablePath', executablePath)
  }
}

export const WhatsMenuPrintApi = {
  print: (url: string) => ipcRenderer.send('print', url)
}

export const DesktopApi = {
  onProfileChange: (callback: (event: Electron.IpcRendererEvent, profile: ProfileType) => void) => ipcRenderer.on('onProfileChange', callback),

  storeProfile: (profile: ProfileType) => ipcRenderer.send('storeProfile', profile),
}

export const TabsApi = {
  setActiveTab: (tab: string) => ipcRenderer.send('setActiveTab', tab)
}

contextBridge.exposeInMainWorld('isElectron', true)
contextBridge.exposeInMainWorld('WhatsAppBotApi', WhatsAppBotApi)
contextBridge.exposeInMainWorld('WhatsMenuPrintApi', WhatsMenuPrintApi)
contextBridge.exposeInMainWorld('DesktopApi', DesktopApi)
contextBridge.exposeInMainWorld('TabsApi', TabsApi)

ipcRenderer.on('log', (event, log) => {
  console.log(log);
})

ipcRenderer.on('error', (event, error) => {
  console.error(error);
})

ipcRenderer.on('warn', (event, error) => {
  console.warn(error);
})