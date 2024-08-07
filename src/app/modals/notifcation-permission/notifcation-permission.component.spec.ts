import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotifcationPermissionComponent } from './notifcation-permission.component';

describe('NotifcationPermissionComponent', () => {
  let component: NotifcationPermissionComponent;
  let fixture: ComponentFixture<NotifcationPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotifcationPermissionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotifcationPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
