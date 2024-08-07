import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientidComponent } from './clientid.component';

describe('ClientidComponent', () => {
  let component: ClientidComponent;
  let fixture: ComponentFixture<ClientidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientidComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
