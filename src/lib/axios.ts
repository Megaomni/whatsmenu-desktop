import axios from "axios";
import { env } from "../environments";

export const whatsmenu_api = axios.create({
  baseURL: env.WM_API_V2,
});

export const whatsmenu_api_v3 = axios.create({
  baseURL: env.WM_API_V3,
});

export const whatsmenu_api_integration = axios.create({
  // baseURL: 'https://api4.whatsmenu.com.br/api/v4/desktop/'
  baseURL: "http://localhost:7777/dashboard/ifood/",
});
