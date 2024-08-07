import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { MenuNavComponent } from './menu-nav.component';

describe('MenuNavComponent', () => {
  let component: MenuNavComponent;
  let fixture: ComponentFixture<MenuNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuNavComponent ],
      imports: [NgbNavModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
