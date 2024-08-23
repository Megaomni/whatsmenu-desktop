import axios from 'axios'

export const apiV2 = axios.create({
  baseURL: process.env.WHATSMENU_API,
})

export const api = axios.create({
  baseURL: process.env.WHATSMENU_API_V3, // 'http://0.0.0.0:7777'
  headers: {
    'Content-Type': 'application/json',
  },
})

export const groveNfeApi = axios.create({
  baseURL: process.env.GROVE_NFE_URL,
  headers: {
    Authorization: `Bearer ${process.env.GROVE_NFE_TOKEN}`,
    'Content-Type': 'application/json',
  },
})
