import { Inject, Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { DateTime } from 'luxon'
import * as moment from 'moment'
import { DialogConfirmDateComponent } from 'src/app/modals/dialog-confirm-date/dialog-confirm-date.component'
import { ProfileType } from 'src/app/profile-type'

@Injectable({
  providedIn: 'root',
})
export class ComponentService {
  constructor(@Inject(MatDialog) private matDialog: MatDialog) {}
  async getPackageDate({
    clientData,
    packageHours,
    everOpen,
    errorType,
    dateChoiced,
  }: {
    clientData: ProfileType
    packageHours: any
    everOpen?: boolean
    errorType?: number | string
    dateChoiced?: DateTime
  }): Promise<DateTime> {
    return new Promise((resolve) => {
      const packageLocal = localStorage.getItem(`${clientData.slug}_packageDate`)

      if (packageLocal === null || everOpen) {
        const dialogDate = this.matDialog.open(DialogConfirmDateComponent, {
          data: {
            clientData: clientData,
            time: DateTime.local(),
            packageHours: packageHours,
            errorType: errorType,
            dateChoiced: dateChoiced,
          },
          autoFocus: false,
          maxWidth: window.innerWidth < 1024 ? '100vw' : '45vw',
          minWidth: window.innerWidth < 1024 ? '100vw' : '45vw',
          closeOnNavigation: false,
          disableClose: true,
        })

        dialogDate.afterClosed().subscribe((time: DateTime | null) => {
          if (!time) {
            resolve(DateTime.fromFormat(packageLocal, 'yyyy-MM-dd HH:mm:ss'))
            return
          }
          localStorage.setItem(`${clientData.slug}_packageDate`, time.toFormat('yyyy-MM-dd HH:mm:ss'))
          resolve(time)
        })
      } else {
        resolve(DateTime.fromFormat(packageLocal, 'yyyy-MM-dd HH:mm:ss'))
      }
    })
  }
}
