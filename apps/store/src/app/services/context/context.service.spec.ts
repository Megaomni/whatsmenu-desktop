import { TestBed } from '@angular/core/testing';
import { CartRequestType } from 'src/app/cart-request-type';
import { CupomType } from 'src/app/cupom';
import Command from 'src/classes/command';
import Table from 'src/classes/table';

import { ContextService } from './context.service';

describe('ContextService', () => {
  let service: ContextService
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContextService);
    service.tables = [
      new Table({
        id: 1,
        name: '01',
        profileId: 1,
        status: true,
        deleted_at: null,
        opened: {
          id: 1,
          commands: [
            new Command({
              id: 1,
              code: 1,
              tableOpenedId: 1,
              name: 'Teste',
              tableId: 1,
              status: true,
              carts: [],
              fees: [],
              formsPayment: [],
              requests: [],
              created_at: '',
              updated_at: '',
            })
          ],
          fees: [],
          formsPayment: [],
          status: true,
          tableId: 1
        }
      })
    ]

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // currency
  it('should be possible to format a number to a currency', () => {
    expect(service.currency(10)).toEqual('R$' + String.fromCharCode((parseInt('a0', 16))) + '10,00')
  })

  it('should be possible to format a number to a currency without currency symbol', () => {
    expect(service.currency(10, true)).toEqual('10,00')
  })

  // getActiveTable
  it('should be possible get the table active', () => {
    service.activeTableId = 1
    expect(service.getActiveTable().name).toEqual('01')
  })

  // getActiveCommand
  it('should be possible get the command active', () => {
    service.activeTableId = 1
    service.activeCommandId = 1
    expect(service.getActiveCommand().name).toEqual('Teste')
  })

  // closeCommandEffect
  it('should be possible to change the open table when a command is closed', () => {
    service.activeTableId = 1
    service.activeCommandId = 1
    service.getActiveCommand().status = false
    service.closeCommandEffect(service.getActiveCommand())
    expect(service.getActiveTable().opened).toBe(undefined)
  })
});
