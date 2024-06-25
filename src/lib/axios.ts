import axios from "axios";
import { env } from "../enviroments";

export const whatsmenu_api = axios.create({
  baseURL: env.WM_API_V2,
});

export const whatsmenu_api_v3 = axios.create({
  baseURL: env.WM_API_V3,
});
