
import path from "node:path"
import { ProfileType } from "../../@types/profile"
import { store } from "../../main/store"
import { WebTabContentsView } from "../../extends/tab"

export const create_pdv_tab = () => {
  
  const profile = store.get('configs.profile') as ProfileType
  const tab = new WebTabContentsView({
    id: 'pdv',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.webContents.loadURL(`https://whatsmenu.com.br/${profile?.slug}/pdv`)
  store.onDidChange('configs', (newValue) => {
    if (profile?.slug !== newValue.profile?.slug) {
      tab.webContents.loadURL(`https://whatsmenu.com.br/${newValue.profile.slug}/pdv`)
    }
  })
  
  tab.setVisible(false)

  return tab
}