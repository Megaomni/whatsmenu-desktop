import axios from "axios";

export const whatsmenu_api = axios.create({
    baseURL: process.env.WHATSMENU_API
})