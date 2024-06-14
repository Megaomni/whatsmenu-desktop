
import path from "node:path"
import { WebTabContentsView } from "../../extends/tab"
import { getProfile, store } from "../../main/store"
import { whatsmenu_api_v3 } from "../../lib/axios"
import { DateTime } from "luxon"
import { WeekDayType, WeekType } from "../../@types/week"
import axios from "axios"

export const create_dashboard_tab = () => {
  
  const tab = new WebTabContentsView({
    id: 'dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.webContents.loadURL(`https://next.whatsmenu.com.br/`)
  // tab.webContents.loadURL(`https://teste.whatsmenu.com.br/`)
  // tab.webContents.loadURL(`http://localhost:3000`)

  tab.webContents.on('did-finish-load', () => {
    const profile = getProfile()
    const merchant = async () => {
      try {
        const { data } = await axios.get('http://localhost:7777/dashboard/ifood/merchantId')
        store.set('configs.merchant', data)
      } catch (error) {
        console.error(error);
      }
    }
    let open = false
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

    // const polling = async () => {
    //   try {
    //     console.log('chamando polling')
    //     const {data} = await whatsmenu_api_v3.get('polling')
    //     console.log('resposta', data)
        
    //   } catch (error) {
    //     console.log('Erro ao fazer polling no iFood:', error)
    //   }
    // }

    // if(open && profile.options.integrations.ifood) {
    //   setInterval(async () => { 
    //     try { 
    //       const {data} = await whatsmenu_api_v3.get('polling') 
    //       console.log('resposta', data)
    //     } catch (error) { 
    //       console.log('Erro ao fazer polling no iFood:', error) } 
    //   } , 5000)
    // }
    
    
  })

  return tab
}