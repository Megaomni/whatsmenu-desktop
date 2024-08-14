import { CartType } from './../../cart-type';
import { CommandType } from 'src/app/command-type';
import { TableType } from './../../table-type';
import { ClientType } from 'src/app/client-type';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import Command from 'src/classes/command';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent implements OnInit {
  clientData: ClientType;
  table: TableType;
  command: Command;
  total: number;

  constructor(@Inject(MAT_DIALOG_DATA) public data) { }
  public translate: TranslateService;

  ngOnInit(): void {
    this.clientData = this.data.clientData,
    this.table = this.data.table,
    this.command = this.table.opened?.commands.find(command => command.id === this.data.command.id)
    if (this.command) this.command.requests = this.command.requests.filter(request => request.status !== 'canceled')
    this.total = this.command && this.command.requests.reduce((acc, element: any) => acc + element.total, 0) || 0
  }

  public calcProductTotalValue(product: CartType): number {
    if (this.table) {
      let valueTable = product.valueTable;

      if (product.promoteStatusTable) {
        valueTable = product.promoteValueTable;
      }

      product.complements.forEach(complement => {
        valueTable += complement.itens.reduce((a, b) => a + (b.value * b.quantity), 0);
      });

      return valueTable * product.quantity;
    } else {
      let value = product.value;

      if (product.promoteStatus) {
        value = product.promoteValue;
      }

      product.complements.forEach(complement => {
        value += complement.itens.reduce((a, b) => a + (b.value * b.quantity), 0);
      });

      return value * product.quantity;
    }
  }
}
