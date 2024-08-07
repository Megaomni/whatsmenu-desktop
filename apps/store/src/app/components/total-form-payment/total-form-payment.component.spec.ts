import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { CartDetailsComponent } from 'src/app/modals/cart-details/cart-details.component'
import { TotalFormPaymentComponent } from './total-form-payment.component'

describe('CartDetailsComponent', () => {
  let component: CartDetailsComponent
  let fixture: ComponentFixture<CartDetailsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CartDetailsComponent],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CartDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})

describe('TotalFormPaymentComponent', () => {
  let component: TotalFormPaymentComponent
  let fixture: ComponentFixture<TotalFormPaymentComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TotalFormPaymentComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(TotalFormPaymentComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
