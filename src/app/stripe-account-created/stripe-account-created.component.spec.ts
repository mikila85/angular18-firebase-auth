import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripeAccountCreatedComponent } from './stripe-account-created.component';

describe('StripeAccountCreatedComponent', () => {
  let component: StripeAccountCreatedComponent;
  let fixture: ComponentFixture<StripeAccountCreatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StripeAccountCreatedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StripeAccountCreatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
