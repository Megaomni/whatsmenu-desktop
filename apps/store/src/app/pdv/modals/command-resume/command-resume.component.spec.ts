import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CommandResumeComponent } from './command-resume.component'
import { MatDialogRef } from '@angular/material/dialog'

describe('CommandResumeComponent', () => {
  let component: CommandResumeComponent
  let fixture: ComponentFixture<CommandResumeComponent>
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandResumeComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: () => {} },
        },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandResumeComponent)
    component = fixture.componentInstance
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  })

  // cancelCart
  // it('should be possible to cancel a cart of command', async  () => {
  //   const cancelCartSpy = spyOn(component.api, 'changeCartStatus').and.returnValue({ id: 1, status: false } as any)
  //   await component.cancelCart({ id: 1, status: true })
  //   expect(cancelCartSpy).toHaveBeenCalled()
  // });
})
