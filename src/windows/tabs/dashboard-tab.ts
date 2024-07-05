
import path from "node:path"
import { WebTabContentsView } from "../../extends/tab"
import { getMerchant, getProfile, store } from "../../main/store"
import { DateTime } from "luxon"
import { WeekDayType } from "../../@types/week"
import { getMerchantApi, polling } from "../../services/ifood"

export const create_dashboard_tab = () => {
  
  const tab = new WebTabContentsView({
    id: 'dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  // tab.webContents.loadURL(`https://next.whatsmenu.com.br/`)
  // tab.webContents.loadURL(`https://teste.whatsmenu.com.br/`)
  tab.webContents.loadURL(`http://localhost:3000`)

  tab.webContents.on("did-finish-load", () => {
    const profile = getProfile();
    let merchant: any
    let open = false
    if (profile) {

      if(!merchant){
        console.log('não tem o merchant')
      } else {
        console.log('PEGOU O merchant')
      }

      const day = DateTime.local().setZone(profile.timeZone).toISO()
      const today = DateTime.fromISO(day, { zone: profile.timeZone }).toFormat('EEEE').toLowerCase()
      const convert = (text: string) => parseFloat(text.replace(':', '.'))
  
      if (!profile.week[today]) {
        open = false
      }
      const now = parseFloat(DateTime.local().setZone(profile.timeZone).toFormat('HH.mm'))
      const filter = profile.week[today].filter((d: WeekDayType) => now >= convert(d.open) && now <= convert(d.close))
  
      if (filter.length) {
        open = true
      }

      if(open){
        console.log("ABERTO");
      } else {
        console.log("FECHADO");
      }

      store.onDidAnyChange((newValue, oldValue) => {
        console.log(oldValue.configs.profile.options.integrations, newValue.configs.profile.options.integrations)
        if(newValue.configs.profile.options.integrations) {
          getMerchantApi()
          merchant = getMerchant();
          if (open && merchant) {
            setInterval(polling, 30000);
          }
        }
      })
    }
  })

  return tab
}