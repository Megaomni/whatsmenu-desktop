import axios from "axios";

export const apiV2 = axios.create({
  baseURL: process.env.WHATSMENU_API
})

export const api = axios.create({
  baseURL: process.env.WHATSMENU_API_V3, // 'http://0.0.0.0:7777'
  headers: {
    'Content-Type': 'application/json',
  },
})
