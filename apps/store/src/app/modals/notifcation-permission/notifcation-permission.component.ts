import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { PushNotificationsService } from 'src/app/services/push-notifications/push-notifications.service'

export interface NotifcationPermissionComponentData {
  clientId: number
}

@Component({
  selector: 'app-notifcation-permission',
  templateUrl: './notifcation-permission.component.html',
  styleUrls: ['./notifcation-permission.component.scss'],
})
export class NotifcationPermissionComponent {
  loading = false
  faTriangleExclamation = faTriangleExclamation

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: NotifcationPermissionComponentData,
    private pusNotificationshService: PushNotificationsService
  ) {}
  async requestPermission() {
    this.loading = true
    try {
      await this.pusNotificationshService.requestPermission()
      await this.pusNotificationshService.subscribePushNotifications({ clientId: this.data.clientId })
    } catch (error) {
      console.error(error)
    } finally {
      this.loading = false
      this.dialogRef.close()
    }
  }
}
