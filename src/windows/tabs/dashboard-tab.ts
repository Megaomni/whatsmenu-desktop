
import path from "node:path"
import { WebTabContentsView } from "../../extends/tab"
import { getMerchant, getProfile, store } from "../../main/store"
import { DateTime } from "luxon"
import { WeekDayType } from "../../@types/week"
import {  whatsmenu_api_v3 } from "../../lib/axios"
import axios from "axios"
import {io} from '../../services/ws_integration'

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

  tab.webContents.on('did-finish-load', () => {
    const profile = getProfile()
    if(profile) {
      let pollingData
      const getMerchantApi = async () => {
        try {
          const { data } = await whatsmenu_api_v3.get(`merchant?slug=${profile.slug}`)
          store.set('configs.merchant', data)
        } catch (error) {
          console.error(error);
        }
      }

      getMerchantApi()
      const merchant = getMerchant()

      if(!merchant){
        console.log('não tem o merchant')
      } else {
        console.log('PEGOU O merchant')
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
  
      const polling = async () => {
        if (!merchant) {
          console.log('não tem merchant pro polling')
        }
        try {
          console.log('vai chamar o polling')
          const { data } = await axios.get('https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS', {
            headers: {
              'Authorization': `Bearer ${merchant?.token}`,
              'x-polling-merchants': `${merchant?.merchantId}`,
            }
          })
          console.log('DATA DO POLLING', data)
          pollingData = data
          sendPollingDataApi(pollingData, profile.id)
  
        } catch (error) {
          if (error.response) {
            console.error('Server responded with status code:', error.response.status)
            console.error('Response data:', error.response.data)
          } else if (error.request) {
            console.error('No response received:', error.request)
          } else {
            console.error('Error creating request:', error.message)
          }
          throw error
        }
      }

      const sendPollingDataApi = async (pollingData: [], id: number) => {
        try {
          let returnOrders
          console.log('vai enviar o polling pra API')
          if(pollingData.length > 0) {
            returnOrders = await whatsmenu_api_v3.post('ifood/polling', { pollingData, id})
          } 
          // console.log('DATA DO POLLING', data)
          console.log('quantidade de pedidos', returnOrders)
          if(returnOrders) {
            io.to(`ifood:${profile?.slug}`).emit('newOrderIfood', returnOrders.data)
          }
        } catch (error) {
          console.error('erro ao enviar dados do Polling para API integração', error)
        }
      }

      const attToken = async () => {
        try {
          console.log('VAI GERAR UM NOVO TOKEN')
          let formParams
          if (merchant) {
            formParams = {
              clientId: `d67294ed-3436-425b-833c-b4085aac859e`,
              clientSecret: `oor4zyr9jsm58z7eja964q9b8lis07bltnqwimvvinger32n5n0iv6sgk5vybdlj8dd9k9i9s6qnsg8dw074y267cyn74j1a5gj`,
              refreshToken: merchant.refresh_token,
            }
          }
          const { data } = await axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', 
            { grantType: 'refresh_token', ...formParams },
        {
          headers: {
            'content-Type': 'application/x-www-form-urlencoded',
          },
        
          })
          console.log('DATA DO ATT TOKEN', data)
          // ipcRenderer.send('polling', data)
  
        } catch (error) {
          if (error.response) {
            console.error('Server responded with status code:', error.response.status)
            console.error('Response data:', error.response.data)
          } else if (error.request) {
            console.error('No response received:', error.request)
          } else {
            console.error('Error creating request:', error.message)
          }
          throw error
        }
      }

      if(open && merchant) {
        setInterval(polling , 10000)
      }

      if(profile){
        // setInterval(attToken , 8820000)
      }
    }
    
    
  })

  return tab
}