import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandsComponent } from './commands.component';
import { MatDialogRef } from '@angular/material/dialog';
import Command from 'src/classes/command';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';
import { of } from 'rxjs';
import Table from 'src/classes/table';

describe('CommandsComponent', () => {
  let component: CommandsComponent;
  let fixture: ComponentFixture<CommandsComponent>;
  let closeDialogSpy: jasmine.Spy
  let openDialogSpy: jasmine.Spy
  let command: Command

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandsComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandsComponent);
    component = fixture.componentInstance;
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    openDialogSpy = spyOn(component['matDialog'], 'open').and
    .returnValue({
      afterClosed: () => of(true)
    } as any)
    component.context.profile = (profile as unknown) as ProfileType
    fixture.detectChanges();
    command = component.context.profile.tables.flatMap(t => t.opened?.commands).filter(command => command).map(c => new Command(c)).find(c => c.status)
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  });

  // openCommandResume
  it('should be possible to render command-resume modal', () => {
    openDialogSpy = openDialogSpy.and
    .returnValue({
      afterClosed: () => of(command)
    })
    command.carts.push({})
    component.openCommandResume(command)
    expect(openDialogSpy).toHaveBeenCalled()
    expect(closeDialogSpy).toHaveBeenCalledWith({ command })
  });

  it('should be not possible to render command-resume modal if command dont have carts', () => {
    openDialogSpy = openDialogSpy.and
    .returnValue({
      afterClosed: () => of(command)
    })
    command.carts = []
    component.openCommandResume(command)
    expect(openDialogSpy).not.toHaveBeenCalled()
    expect(closeDialogSpy).not.toHaveBeenCalled()
  });

  // closeCommand
  it('should be possible to close a command', async () => {
    command.carts.push({})
    await component.closeCommand(command)
    expect(closeDialogSpy).toHaveBeenCalledWith({ command })
  });

  it('should be possible to close a command and update command status in server if no have carts', async () => {
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    const closeCommandSpy = spyOn(component.api, 'closeCommand').and.returnValue({ status: false } as any)
    const closeCommandEffectSpy = spyOn(component.context, 'closeCommandEffect')
    command.carts = []
    await component.closeCommand(command)
    expect(closeDialogSpy).toHaveBeenCalled()
    expect(closeCommandSpy).toHaveBeenCalledWith(command, component.context.activeTableId, component.context.profile.slug, [])
    expect(command.status).toBeFalse()
    expect(closeCommandEffectSpy).toHaveBeenCalledWith(command)
  });
});