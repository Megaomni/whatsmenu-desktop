import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { faArrowLeft, faPrint } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { PrintService } from 'src/app/services/print/print.service';
import Command from 'src/classes/command';
import Table from 'src/classes/table';
import { CommandResumeComponent } from '../command-resume/command-resume.component';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-commands',
  templateUrl: './commands.component.html',
  styleUrls: ['./commands.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})
export class CommandsComponent implements OnInit {
  faArrowLeft = faArrowLeft
  faPrint = faPrint
  commands: Command[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    private matDialog: MatDialog,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public printService: PrintService,
    public translate: TranslateService,
    ) { }

  async ngOnInit(): Promise<void> {
    // const table: Table = new Table(await this.api.getTable(this.context.activeTableId))
    this.commands = this.context.getActiveTable().opened.commands
  }

  public close(data?: { command?: Command }): void {
    this.dialogRef.close(data)
  }

  public openCommandResume(command: Command): void {
    if (command.carts.length) {
      this.context.activeCommandId = command.id
      this.matDialog.open(CommandResumeComponent, {
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '80vh',
        width: window.innerWidth < 600 ? '100vw' : '790px',
        disableClose: true
      }).afterClosed().subscribe(
        (command: Command) => {
          this.close({ command })
        },
        (error) => {
          console.error(error);
        }
      )
    }
  }

  // API
  public async closeCommand(command: Command): Promise<void> {
    this.context.activeCommandId = command.id;
    this.close({ command })
    if (!command.haveCarts() && this.context.activeTableId) {
      try {
        const { status } = await this.api.closeCommand(command, this.context.activeTableId, this.context.profile.slug, [])
        command.status = !!status
      } catch (error) {
        console.error(error);
        return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      }
    }
  }

  public async printCommand(command: Command) {
    this.printService.printCommand({ table: this.context.getActiveTable(), command, profile: this.context.profile })
  }
}
