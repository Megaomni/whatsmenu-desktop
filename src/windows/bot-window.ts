import { BrowserWindow, Notification, dialog } from "electron";
import path from 'path';
import { WhatsAppBot } from '../services/whatsapp-bot';

let window: BrowserWindow

const bot = new WhatsAppBot()

const botWindow = {
  createWindow() {
    // Create the browser window.
    if (!window) {
      window = new BrowserWindow({
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
        },
      });
    
      // and load the index.html of the app.
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        window.setTitle('WhatsMenu Bot')
      } else {
        window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
      }
      
      bot.on('qr', qr => {
        window.webContents.send('onqrcode', qr)
        window.webContents.send('log', qr)
  
      });
    
      bot.initialize()
        .catch(err => {
          console.error("Deu ruim", err);
          window.webContents.send('error', err)
          dialog.showErrorBox('Ops!', err)
        });
      
      // window.menuBarVisible = false
    } else {
      window.focus()
    }

    return window
  }
}

export {
  botWindow,
  bot
}