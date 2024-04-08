import { Client, LocalAuth } from "whatsapp-web.js";

export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--no-first-run", "--no-zygote", "--single-process", "--disable-gpu"],
    
  }
})