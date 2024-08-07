import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreinfoComponent } from './moreinfo.component';

describe('MoreinfoComponent', () => {
  let component: MoreinfoComponent;
  let fixture: ComponentFixture<MoreinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoreinfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoreinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
