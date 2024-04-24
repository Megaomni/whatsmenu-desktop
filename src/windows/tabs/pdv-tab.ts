import { WebContentsView, screen } from "electron"
import path from "node:path"
import { ProfileType } from "../../@types/profile"
import { store } from "../../main/store"

export const create_pdv_tab = () => {
  const { width, height } = screen.getPrimaryDisplay().size
  const profile = store.get('configs.profile') as ProfileType
  const tab = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.setBounds({ x: 0, y: 50, width, height: height - 185 })
  tab.webContents.loadURL(`https://whatsmenu.com.br/${profile?.slug}/pdv`)
  store.onDidChange('configs', (newValue) => {
    if (profile !== newValue.profile) {
      tab.webContents.loadURL(`https://whatsmenu.com.br/${newValue.profile.slug}/pdv`)
    }
  })
  
  tab.setVisible(false)

  return tab
}