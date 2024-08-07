import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowAltCircleDown, faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons';
import { faArrowLeft, faArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { ContextService } from 'src/app/services/context/context.service';
import Command from 'src/classes/command';
import Table, { TableOpened } from 'src/classes/table';

@Component({
  selector: 'app-switch-table',
  templateUrl: './switch-table.component.html',
  styleUrls: ['./switch-table.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss'],
})
export class SwitchTableComponent implements OnInit {
  deviceWidth = window.innerWidth

  newTableId: number
  tablesToSwitch: Table[] = []
  oldTable: Table

  faArrowLeft = faArrowLeft
  faArrowAltCircleRight = faArrowAltCircleRight
  faArrowAltCircleDown = faArrowAltCircleDown
  faArrowsAlt = faArrowsAlt

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
  ) { }

  ngOnInit(): void {
    this.resetTables()
  }

  public close(confirm: boolean): void {
    if (confirm) {
      const data = {
        newTableId: this.newTable().id,
        oldTableId: this.oldTable.opened.id,
        commandsIds: this.newTable().opened?.commands.filter(c => c.tableOpenedId !== this.newTable().opened.id).map(c => c.id) ?? []
      }
      this.dialogRef.close(data)
      return
    }
    this.dialogRef.close()
  }

  public newTable(): Table {
    const newTableResult = this.tablesToSwitch.find(t => t.id === this.newTableId)
    if (newTableResult && !newTableResult.opened) {
      newTableResult.opened = { commands: [] } as TableOpened
    }
    return newTableResult
  }

  public resetTables(id?: number | string): void {
    if (this.context.getActiveTable()) {
      this.oldTable = JSON.parse(JSON.stringify(this.context.getActiveTable()))
      this.tablesToSwitch = this.context.tables.filter(t => t.id !== this.context.getActiveTable()?.id).map(t => JSON.parse(JSON.stringify(t)))
      this.newTableId = id ? Number(id) : this.tablesToSwitch[0].id
    }
  }

  public dragCondition(command: Command): boolean {
    return this.newTable().opened?.commands.some(c => c.name === command.name)
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (event.container.data && (event.previousContainer === event.container)) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.container.data?.length  + 1,
      );
    }
  }
}
