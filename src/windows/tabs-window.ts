import { BaseWindow, WebContentsView, ipcMain, screen } from "electron"

import path from 'node:path';
import { create_dashboard_tab } from "./tabs/dashboard-tab";
import { create_pdv_tab } from "./tabs/pdv-tab";
import { create_bot_tab } from "./tabs/bot-tab";
import { create_menu_tab } from "./tabs/menu-tab";
import { store } from "../main/store";
import { ProfileType } from "../@types/profile";

export const tabsWindow =  {
  createWindow: () => {
    const mainScreen = screen.getPrimaryDisplay()
    const { width, height } = mainScreen.size

    const window = new BaseWindow({
      width,
      height,
    })

    const tabGroup = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true
      },
    })

    const tabs = [create_dashboard_tab(), create_pdv_tab(), create_menu_tab(), create_bot_tab()]
    tabGroup.setBounds({ x: 0, y: 0, width, height: 50 })
    tabGroup.webContents.openDevTools()

    ipcMain.on('setActiveTab', (_, tabIndex) => {
      console.log('===setActiveTab===');
      tabs.forEach((tab) => {
        console.log(tab.id, tabIndex);
        tab.setVisible(tab.id === tabIndex)
      })
    })

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      tabGroup.webContents.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/tabs.html`);
      window.setTitle("WhatsMenu Bot");
    } else {
      tabGroup.webContents.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/tabs.html`
        )
      );
    }
    
    window.contentView.addChildView(tabGroup)
    tabs.forEach(tab => window.contentView.addChildView(tab))

    tabGroup.webContents.on('did-finish-load', () => {
      const profile = store.get('configs.profile') as ProfileType
      tabGroup.webContents.send('onProfileChange', profile)
      store.onDidChange('configs', (newValue) => {
        tabGroup.webContents.send('onProfileChange', newValue.profile)
      })
    })

    return window
  }
}