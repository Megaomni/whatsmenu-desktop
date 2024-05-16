import axios from "axios";

export const whatsmenu_api = axios.create({
    baseURL: 'https://api2.whatsmenu.com.br/'
})

export const whatsmenu_api_v3 = axios.create({
    baseURL: 'https://api3.whatsmenu.com.br/api/v3/desktop/'
    // baseURL: 'http://localhost:7777/api/v3/desktop/'
})