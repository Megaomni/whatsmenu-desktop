import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeesTableComponent } from './fees-table.component';
import { profile } from 'src/test/utils/profile';
import { ProfileType } from 'src/app/profile-type';
import Table from 'src/classes/table';
import { FeeType } from 'src/app/fee-type';

describe('FeesTableComponent', () => {
  let component: FeesTableComponent;
  let fixture: ComponentFixture<FeesTableComponent>;
  let commandFee: FeeType
  let tableFee: FeeType

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeesTableComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    component.context.activeCommandId = component.context.tables.flatMap(table => table.opened?.commands).filter(c => c).find(command => command.status)?.id
    commandFee = {
      automatic: true,
      code: 'TESTE',
      status: true,
      type: 'fixed',
      value: 10,
      quantity: 1
    }
    tableFee = {
      automatic: true,
      code: 'TESTE',
      status: true,
      type: 'fixed',
      value: 10,
      quantity: 3
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // setFees
  it('should be possible to set table fees', () => {
    const getUpdatedFeesSpy = spyOn(component.context.getActiveTable().opened, 'getUpdatedFees')
    component.tableType = 'table'
    component.setFees()
    expect(getUpdatedFeesSpy).toHaveBeenCalledWith(false, true)
  })

  it('should be possible to set command fees', () => {
    const getActiveCommandSpy = spyOn(component.context, 'getActiveCommand')
    component.tableType = 'command'
    component.setFees()
    expect(getActiveCommandSpy).toHaveBeenCalled()
  })

  // setCommandFeeQuantity
  it('should be possible to set quantity value of a command', () => {
    const event = 2
    const oldTableFeeQuantity = tableFee.quantity
    const oldCommandFeeQuantity = commandFee.quantity
    component.setCommandFeeQuantity(event, commandFee, tableFee)
    expect(tableFee.quantity).toEqual(oldTableFeeQuantity + event - oldCommandFeeQuantity)
    expect(commandFee.quantity).toEqual(event)
  })

  // setCommandFeeAutomatic
  it('should be possible to set automatic value of a command', () => {
    let event = true
    const oldTableFeeQuantity = tableFee.quantity
    const oldCommandFeeQuantity = commandFee.quantity
    component.setCommandFeeAutomatic(event, commandFee, tableFee)
    expect(tableFee.quantity).toEqual(oldTableFeeQuantity + oldCommandFeeQuantity)
  })

  it('should be possible to set automatic value of a command and set quantity to 0 if false', () => {
    let event = false
    const oldTableFeeQuantity = tableFee.quantity
    const oldCommandFeeQuantity = commandFee.quantity
    component.setCommandFeeAutomatic(event, commandFee, tableFee)
    expect(tableFee.quantity).toEqual(oldTableFeeQuantity - oldCommandFeeQuantity)
    expect(commandFee.oldQuantity).toEqual(oldCommandFeeQuantity)
    expect(commandFee.quantity).toEqual(0)
  })
  
});
