import { Notification } from "electron";
import isDev from "electron-is-dev";
import { Client, ClientOptions, ContactId, LocalAuth } from "whatsapp-web.js";
import child_process from "node:child_process";

export class WhatsAppBot extends Client {
  messagesQueue: Array<{ contact: string, message: string }> = []
  /**
   * Constructor for the class with optional client options.
   *
   * @param {ClientOptions} [config] - Optional configuration for the client
   */
  constructor(config?: ClientOptions) {
    if (!config) {
      config = {}
    }
    config.authStrategy = new LocalAuth()
    config.puppeteer = {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process", // Desativar o modo de processamento único - comentar caso seja necessário utilizar headless
      ]
    }
    let executablePath
    if (!isDev || process.platform === 'win32') {

      // Comando para acessar o registro do Windows
      const command = 'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe"';

      // Executa o comando e manipula a saída
      child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Erro ao executar o comando: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`Erro do comando: ${stderr}`);
          return;
        }
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      });
    }
    config.puppeteer.executablePath = executablePath
    super(config)
    this.on('ready', () => {
      new Notification({
        title: 'Robô pronto!',
        body: 'Estou pronto para enviar mensagens'
      }).show()
      
      this.sendQueuedmessages()
    })
    this.on('disconnected', () => {
      new Notification({
        title: 'Robô desconectado!',
        body: 'Não será possível enviar mensagens'
      }).show()
    })
  }

  sendQueuedmessages() {
    for (const messageQueued of this.messagesQueue) {
      const { contact, message } = messageQueued
      this.sendMessage(contact, message)
      this.messagesQueue.slice(this.messagesQueue.indexOf(messageQueued), 1)
    }
  }

  checkNinthDigit = async (contact: string): Promise<string> => {
    try {
      let contactId: ContactId
      if (contact.startsWith('55') && contact.length === 13 && contact[4] === '9') {
        contactId = await this.getNumberId(contact.slice(0, 4) + contact.slice(5))
      }

      if (!contactId) {
        contactId = await this.getNumberId(contact)
      }

      if (contactId) {
        contact = contactId._serialized
        return contact
      } else {
        throw new Error('Contato inválido!')
      }
    } catch (error) {
      throw new Error('Contato inválido!', { cause: 'checkNinthDigit' })
    }
  }
}