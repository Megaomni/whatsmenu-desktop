import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { ApiService } from '../api/api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  subscription: PushSubscription
  isSubscribing = false
  permission: NotificationPermission
  hasSuport = false
  onNotification: (payload: unknown) => void | null = null
  constructor(
    private pushSw: SwPush,
    private api: ApiService
  ) {
    if (!('serviceWorker' in navigator)) {
      this.permission = 'denied'
      console.error(new Error("No support for service worker!"));
      return
    }
    if (!('Notification' in window)) {
      this.permission = 'denied'
      console.error(new Error("No support for notification API"));
      return
    }
    if (!('PushManager' in window)) {
      this.permission = 'denied'
      console.error(new Error("No support for Push API"));
      return 
    }
    this.hasSuport = true
    this.permission = Notification.permission
    this.pushSw.notificationClicks.subscribe((event) => {
      window.focus()
    })
    this.pushSw.messages.subscribe((message) => {
      if (this.onNotification) {
        this.onNotification(message)
      }
    })
  }
  public async requestPermission() {
    if (this.hasSuport) {
      this.permission = await Notification.requestPermission();
      if (this.permission !== 'granted') {
        throw new Error("Notification permission not granted")
      }
    }
  }

  public async subscribePushNotifications({ clientId }: { clientId: number }) {
    if (this.hasSuport && !this.subscription && clientId) {
      this.isSubscribing = true
      this.subscription = await this.pushSw.requestSubscription({ serverPublicKey: environment.webpushPublicKey })
      await this.api.clientSavePushSubscription({ subscription: this.subscription, clientId, userAgent: navigator.userAgent })
    }
  }
}
