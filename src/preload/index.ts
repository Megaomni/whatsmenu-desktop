// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";

// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


export const WhatsAppBotApi = {
  onqrcode: (callback: (event: Electron.IpcRendererEvent, qrcode: string) => void) => ipcRenderer.on('onqrcode', callback),
  onready: (callback: (event: Electron.IpcRendererEvent) => void) => ipcRenderer.on('onready', callback),
}

contextBridge.exposeInMainWorld('WhatsAppBotApi', WhatsAppBotApi)

ipcRenderer.on('log', (event, log) => {
  console.log(log);
})

ipcRenderer.on('error', (event, error) => {
  console.error(error);
})