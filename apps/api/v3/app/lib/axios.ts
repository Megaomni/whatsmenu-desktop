import env from '#start/env'
import axios from 'axios'

export const apiV2 = axios.create({
  baseURL: env.get('V2_ENDPOINT'),
})

export const ifoodApi = axios.create({
  baseURL: env.get('INTEGRATION_SERVICE_API'),
  headers: {
    Authorization: `Bearer ${env.get('TOKEN_USER_INTEGRATION')}`,
  },
})
