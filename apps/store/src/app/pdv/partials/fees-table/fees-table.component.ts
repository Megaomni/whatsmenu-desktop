import { AfterViewChecked, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FeeType } from 'src/app/fee-type';
import { ContextService } from 'src/app/services/context/context.service';
import { TranslateService } from 'src/app/translate.service';
import Command from 'src/classes/command';

@Component({
  selector: 'app-fees-table',
  templateUrl: './fees-table.component.html',
  styleUrls: ['./fees-table.component.scss', '../../pdv.component.scss']
})
export class FeesTableComponent implements OnInit {
  @Input() tableType: 'table' | 'command'
  @Output() feesChange = new EventEmitter() 
  fees: FeeType[] = []

  faChevronDown = faChevronDown

  constructor(
    public translate: TranslateService,
    public context: ContextService
  ) { }

  ngOnInit(): void {
    this.setFees()
  }

  public getCommandFee(command: Command, profileFee: FeeType): FeeType {
    const fee = command.fees.find(fee => fee.code === profileFee.code)
    if (!fee) {
      command.fees.push({ ...profileFee, quantity: 0 })
    }
    return command.fees.find(fee => fee.code === profileFee.code)
  }

  public setFees(): void {
    if (this.tableType === 'table') {
      this.fees = this.context.getActiveTable().opened.getUpdatedFees(false, true)
    }
    if (this.tableType === 'command') {
      this.fees = this.context.getActiveCommand()?.fees
    }
    if (!this.fees) {
      this.fees = []
    }

    this.context.profile.fees.forEach(profileFee => {
      if (!this.fees.find(fee => fee.code === profileFee.code)) {
        this.fees.push({...profileFee, quantity: 0})
      }
    })

    this.fees.forEach(fee => {
      const profileFee = this.context.profile.fees.find(f => f.code === fee.code)
      if (profileFee) {
        fee.status = profileFee.status
      }
    })
  }

  public setCommandFeeQuantity(event: number, commandFee: FeeType, tableFee: FeeType): void {
    event = Math.max(0, event)
    tableFee.quantity += event - commandFee.quantity
    commandFee.quantity = event
    this.feesChange.emit()
  }

  public setCommandFeeAutomatic(event: boolean, commandFee: FeeType, tableFee: FeeType): void {
    commandFee.automatic = event
    if (commandFee.automatic) {
      commandFee.quantity = commandFee.oldQuantity ?? commandFee.quantity
      tableFee.quantity += commandFee.quantity
    } else {
      tableFee.quantity -= commandFee.quantity
      commandFee.oldQuantity = commandFee.quantity
      commandFee.quantity = 0
    }
    this.feesChange.emit()
  }

  public toggleAllFixedCommandFees(event: boolean , fee: FeeType): void {
      const feesInputs = Array.from(document.querySelectorAll(`.fee-${fee.id}`)) as HTMLInputElement[]
      feesInputs.forEach(input => {
        if(input.checked !== event) input.click()
      })
  }

  public toggleAllPercentCommandFees(event: boolean , fee: FeeType): void {
      for (const command of this.context.getActiveTable().opened?.commands) {
        if (command.status) {
          this.setCommandFeeAutomatic(event , this.getCommandFee(command, fee) , fee)
        }
      }
  }
}
