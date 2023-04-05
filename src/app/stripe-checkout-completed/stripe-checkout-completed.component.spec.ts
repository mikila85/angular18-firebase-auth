import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripeCheckoutCompletedComponent } from './stripe-checkout-completed.component';

describe('StripeCheckoutCompletedComponent', () => {
  let component: StripeCheckoutCompletedComponent;
  let fixture: ComponentFixture<StripeCheckoutCompletedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StripeCheckoutCompletedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StripeCheckoutCompletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
