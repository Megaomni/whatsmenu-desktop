import axios from "axios";

export const whatsmenu_api = axios.create({
    baseURL: 'https://api2.whatsmenu.com.br/'
})