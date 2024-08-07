import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BartenderComponent } from './bartender.component';

describe('BartenderComponent', () => {
  let component: BartenderComponent;
  let fixture: ComponentFixture<BartenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BartenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BartenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
