import { Injectable } from '@angular/core';
import { ClientType } from './client-type';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  isElectron = 'isElectron' in window;
  public sendMessage(contact: string, message: string, client?: ClientType) {
    if ("WhatsAppBotApi" in window) {
      (window.WhatsAppBotApi as any).sendMessage(contact, message, client)
    }
  }
}
