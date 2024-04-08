import { BrowserWindow, dialog } from "electron";
import path from 'path';
import { client } from '../bot';

let window: BrowserWindow

export const botWindow = {
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
      
      // Open the DevTools.
      client.on('ready', () => {
        window.webContents.send('log', 'Client is ready!')
      });
      
      client.on('qr', qr => {
        window.webContents.send('onqrcode', qr)
        window.webContents.send('log', qr)
  
      });
    
      client.initialize().catch(err => {
        console.error("Deu ruim", err);
        window.webContents.send('error', err)
        dialog.showErrorBox('Ops!', err)
      });
      
      window.menuBarVisible = false
    } else {
      window.focus()
    }

    return window
  }
}
