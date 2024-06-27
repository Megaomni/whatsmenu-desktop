
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

  tab.webContents.on("did-finish-load", () => {
    const profile = getProfile();
    let merchant: any
    if (profile) {
      let pollingData;
      const getMerchantApi = async () => {
        try {
          console.log('PEGANDO O MERCHANT')
          const { data } = await whatsmenu_api_v3.get(
            `/merchant?slug=${profile.slug}`
          );
          store.set("configs.merchant", data);
        } catch (error) {
          console.error(error);
        }
      }

      store.onDidAnyChange((newValue, oldValue) => {
        console.log(oldValue.configs.profile.options.integrations, newValue.configs.profile.options.integrations)
        if(newValue.configs.profile.options.integrations) {
          getMerchantApi();
          merchant = getMerchant();
          polling();
          if (open && merchant) {
            setInterval(polling, 30000);
          }
        }
      })
      // tab.webContents.on('did-navigate-in-page', () => {
      //  if (open && merchant) {
      //   polling();
      //   setInterval(polling, 30000);
      // }
      // })

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

      if(open){
        console.log("ABERTO");
      } else {
        console.log("FECHADO");
      }
      
      const polling = async () => {
        // attToken()
        try {
          console.log('vai chamar o polling')
          const { data } = await axios.get('https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS', {
            headers: {
              'Authorization': `Bearer ${merchant?.token}`,
              'x-polling-merchants': `${merchant?.merchantId}`,
            }
          })
          console.log('DATA DO POLLING', data)
          console.log('QUANTIDADE DO POLLING', data.length)
          pollingData = data
          if(pollingData.length > 0) {
            sendPollingDataApi(pollingData, profile.id, profile.slug)
            pollingAcknowledgment(pollingData)
          }
  
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

      const sendPollingDataApi = async (pollingData: [], id: number, slug: string) => {
        try {
          let returnOrders
          console.log('vai enviar o polling pra API')
          if(pollingData.length > 0) {
            returnOrders = await whatsmenu_api_v3.post('ifood/polling', { pollingData, id, slug})
          } 
          console.log('PEDIDOS TRATADOS DO POLLING', returnOrders)
          if(returnOrders) {
            io.to(`ifood:${profile?.slug}`).emit('newOrderIfood', returnOrders.data)
          }
        } catch (error) {
          console.error('erro ao enviar dados do Polling para API integração', error)
        }
      }

      const pollingAcknowledgment = async (pollingData: []) => {
        try {
          console.log('VAI FAZER O RECONHECIMENTO DO POLLING')
          const { data } = await axios.post('https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment',pollingData ,{
            headers: {
              'Authorization': `Bearer ${merchant?.token}`,
            }
          })
        } catch (error) {
          console.error('erro ao fazer o reconhecimento pelo ifood', error)
        }
      }

      const attToken = async () => {
        try {
          console.log('VAI GERAR UM NOVO TOKEN')
          let formParams
          if (merchant) {
            formParams = {
              clientId: `${process.env.IFOOD_CLIENT_ID}`,
              clientSecret: `${process.env.IFOOD_CLIENT_SECRET}`,
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
  
          
          if(data) {
            console.log("GERADO TOKEN");
          } else {
            console.log("NÃO GEROU O TOKEN");
          }
          
          merchant.token = data.accessToken;
          merchant.refresh_token = data.refreshToken;

          store.set("configs.merchant", merchant)
          
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
        polling()
        setInterval(polling , 30000)
      }

      if(profile){
        // setInterval(attToken , 8820000)
      }

      // let time
      // let timeDiff
      // let tokenCreated
      // let threeHours = false

      // if (merchant) {
      //   tokenCreated = merchant.controls.dateTokenCreated
      // }

      // if (tokenCreated) {
      //   time = DateTime.fromISO(tokenCreated, { zone: profile.timeZone })
      // }
      // const nowHour = DateTime.now()
      // if (time) {
      //   timeDiff = nowHour.diff(time, 'hours').hours
      //   if (timeDiff > 3) {
      //     threeHours = true
      //   } else {
      //     threeHours = false
      //   }
      // }
      // console.log('tempo diferença', timeDiff, threeHours)
      // if (threeHours) {
      //   console.log('Passou de 3 horas')
      //   attToken()
      // } else {
      //   console.log('Não passou de 3 horas')
      // }
    }
  })

  return tab
}