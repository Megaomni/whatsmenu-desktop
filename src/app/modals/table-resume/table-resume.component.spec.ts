import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableResumeComponent } from './table-resume.component';

describe('TableComponent', () => {
  let component: TableResumeComponent;
  let fixture: ComponentFixture<TableResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableResumeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
