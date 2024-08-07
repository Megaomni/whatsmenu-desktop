import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarshopComponent } from './navbarshop.component';

describe('NavbarshopComponent', () => {
  let component: NavbarshopComponent;
  let fixture: ComponentFixture<NavbarshopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavbarshopComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarshopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
