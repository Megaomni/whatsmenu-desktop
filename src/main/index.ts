import { whatsmenuWindow } from './../windows/whatsmenu-window';
import { app, BrowserWindow, dialog } from 'electron';
import isDev from 'electron-is-dev';
import path from "node:path";

import '../main/menu';
import '../main/ipc';
import '../main/auto-update';
import '../main/store';

import { decodeDeepLinkMessage } from '../utils/decode-deep-link-message';
import { WhatsApp } from '../services/whatsapp';

let mainWindow: BrowserWindow

if (require('electron-squirrel-startup')) {
  app.quit();
}
export const whatsAppService = new WhatsApp()
const loadWindows = () => {
 mainWindow = whatsmenuWindow.createWindow()
}

if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
  app.setAsDefaultProtocolClient('whatsmenu-whatsapp-bot-dev', process.execPath, [path.resolve(process.argv[1]), '']);
} else {
  app.setAsDefaultProtocolClient('whatsmenu-whatsapp-bot');
}

const goTheLock = app.requestSingleInstanceLock()

if (!goTheLock) {
  app.quit()
} else {
  app.on('second-instance', async (event, commandLine) => {
    // eslint-disable-next-line prefer-const
    let { contact, message } = decodeDeepLinkMessage(commandLine[commandLine.length - 1])
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      try {
        if (whatsAppService.bot) {
          const validatedContact = await whatsAppService.checkNinthDigit(contact)
          whatsAppService.bot.sendMessage(`${validatedContact}`, message)
        } else {
          await whatsAppService.initBot()
          whatsAppService.messagesQueue.push({ contact: `${contact}@c.us`, message })
          await whatsAppService.bot.initialize()
        } 
        
      } catch (error) {
        if (error instanceof Error) {
          if (error.cause === 'checkNinthDigit') {
            dialog.showErrorBox('Ops!', error.message)
          }
        }
      }
    }
  })
  
  app.on('open-url', async (event, url) => {
    dialog.showErrorBox('Ops!', `URL: ${url}`)
  
    const { contact, message } = decodeDeepLinkMessage(url)
    try {
      const validatedContact = await whatsAppService.checkNinthDigit(contact)
    
      if (whatsAppService.bot) {
        whatsAppService.bot.sendMessage(`${validatedContact}@c.us`, message)
      } else {
        whatsAppService.messagesQueue.push({ contact: `${validatedContact}@c.us`, message })
        await whatsAppService.initBot()
        await whatsAppService.bot.initialize()
      }  
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.cause === 'checkNinthDigit') {
          dialog.showErrorBox('Ops!', error.message)
        }
      }
    }
  });
}

app.on('ready', loadWindows);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    loadWindows()
  }
});