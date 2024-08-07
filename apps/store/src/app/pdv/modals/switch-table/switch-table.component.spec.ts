import { CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchTableComponent } from './switch-table.component';
import { MatDialogRef } from '@angular/material/dialog';
import Table from 'src/classes/table';
import { profile } from 'src/test/utils/profile';
import { ProfileType } from 'src/app/profile-type';

describe('SwitchTableComponent', () => {
  let component: SwitchTableComponent;
  let fixture: ComponentFixture<SwitchTableComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SwitchTableComponent],
      imports: [CdkDropList],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchTableComponent);
    component = fixture.componentInstance;
    component.context.profile = (profile as unknown as ProfileType)
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close(false)
    expect(closeDialogSpy).toHaveBeenCalled()
  });

  it('should be possible to close the modal and confirm alterations', () => {
    const data = {
      newTableId: component.newTable().id,
      oldTableId: component.oldTable.opened.id,
      commandsIds: component.newTable().opened?.commands.filter(c => c.tableOpenedId !== component.newTable().opened.id).map(c => c.id) ?? []
    }
    component.close(true)
    expect(closeDialogSpy).toHaveBeenCalledWith(data)
  });

  // resetTables
  it('should be possible to reset tables', () => {
    component.resetTables()
    expect(component.tablesToSwitch).not.toContain(jasmine.arrayContaining([component.context.getActiveTable()]))
  });
});
