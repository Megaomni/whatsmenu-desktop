import axios from 'axios'

export const apiV2 = axios.create({
  baseURL: process.env.WHATSMENU_API,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = axios.create({
  baseURL: process.env.WHATSMENU_API_V3,
  headers: {
    'Content-Type': 'application/json',
  },
})
