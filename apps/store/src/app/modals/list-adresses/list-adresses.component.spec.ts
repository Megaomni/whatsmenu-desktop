import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAdressesComponent } from './list-adresses.component';

describe('ListAdressesComponent', () => {
  let component: ListAdressesComponent;
  let fixture: ComponentFixture<ListAdressesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListAdressesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAdressesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
