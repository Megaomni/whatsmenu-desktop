import { app, BrowserWindow, dialog } from 'electron';
import isDev from 'electron-is-dev';
import path from "node:path";
import { whatsmenuWindow } from '../windows/whatsmenu-window';

import '../main/menu';
import { decodeDeepLinkMessage } from '../utils/decode-deep-link-message';
import { WhatsApp } from '../services/whatsapp';

if (require('electron-squirrel-startup')) {
  app.quit();
}
export const whatsAppService = new WhatsApp()
const loadWindows = () => {
  whatsmenuWindow.createWindow()
}

if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
  app.setAsDefaultProtocolClient('whatsmenu-whatsapp-bot-dev', process.execPath, [path.resolve(process.argv[1]), '']);
} else {
  app.setAsDefaultProtocolClient('whatsmenu-whatsapp-bot');
}

app.on('second-instance', async (event, commandLine) => {
  // Someone tried to run a second instance, we should focus our window.
  // eslint-disable-next-line prefer-const
  let { contact, message } = decodeDeepLinkMessage(commandLine[commandLine.length - 1])
  // if (mainWindow) {
  //   if (mainWindow.isMinimized()) mainWindow.restore()
  //   try {
  //     if (whatsAppReady) {
  //       mainWindow.webContents.send('log', whatsAppReady)
  //       contact = await checkNinthDigit(contact)
  //       mainWindow.webContents.send('warn', 'ANTES DE ENVIAR MENSAGEM')
  //       const sendMessageReturn = await whatsappClient.sendMessage(contact, message)
  //       mainWindow.webContents.send('warn', sendMessageReturn)
  //     } else {
  //       mainWindow.webContents.send('warn', 'LOSTMESSAGES')
  //       lostMessages.push({ contact, message })
  //     }
  //   } catch (error) {
  //     mainWindow.webContents.send('error', error)
  //     dialog.showErrorBox('Ops!', error)
  //   }
  // } else {
  //   mainWindow.webContents.send('error', 'MAIN WINDOW NOT FOUND')
  // }

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
  // the commandLine is array of strings in which last element is deep link url
  // the url str ends with /
})

app.on('open-url', async (event, url) => {
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