import axios from "axios";
import { whatsmenu_api_v3 } from "../lib/axios";
import { getMerchant, getProfile, store } from "../main/store";
import {io} from '../services/ws_integration'
import { DateTime } from "luxon";


const profile = getProfile()
const merchant = getMerchant()
let pollingData

export const getMerchantApi = async () => {
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

export const polling = async () => {

    try {
      console.log('vai chamar o polling')
      const { data } = await axios.get('https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS', {
        headers: {
          'Authorization': `Bearer ${merchant?.token}`,
          'x-polling-merchants': `${merchant?.merchantId}`,
        }
      })

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
      console.log('PEDIDOS PARA POLLING', pollingData)
      if(pollingData.length > 0) {
        returnOrders = await whatsmenu_api_v3.post('ifood/polling', { pollingData, id, slug})
      } 
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

  let time
      let timeDiff
      let tokenCreated
      let threeHours = false

      if (merchant) {
        tokenCreated = merchant.controls.dateTokenCreated
      }

      if (tokenCreated) {
        time = DateTime.fromISO(tokenCreated, { zone: profile.timeZone })
      }
      const nowHour = DateTime.now()
      if (time) {
        timeDiff = nowHour.diff(time, 'hours').hours
        if (timeDiff > 3) {
          threeHours = true
        } else {
          threeHours = false
        }
      }
      console.log('tempo diferença', timeDiff, threeHours)
      if (threeHours) {
        console.log('Passou de 3 horas')
        attToken()
      } else {
        console.log('Não passou de 3 horas')
      }