import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastService } from 'ng-metro4';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { PrintService } from 'src/app/services/print/print.service';

@Component({
  selector: 'app-confirm-print',
  templateUrl: './confirm-print.component.html',
  styleUrls: ['./confirm-print.component.scss']
})
export class ConfirmPrintComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: 'command' | 'table', commandId: number, tableEmpty: boolean },
    @Inject(MatDialogRef) private dialogRef,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public printService: PrintService
  ) { }

  public close() {
    this.dialogRef.close()
  }

  public async printTable() {
    this.printService.printTable({ profile: this.context.profile, table: this.context.getActiveTable() })
    this.dialogRef.close()
  }

  public async printCommand(commandId: number) {
    this.context.activeCommandId === commandId
    this.printService.printCommand({ table: this.context.getActiveTable(), command: this.context.getActiveCommand(), profile: this.context.profile })

    this.dialogRef.close()
  }
}
