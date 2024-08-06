import env from '#start/env'
import axios from 'axios'

export const apiV2 = axios.create({
  baseURL: env.get('V2_ENDPOINT'),
})
