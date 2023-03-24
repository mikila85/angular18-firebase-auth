import { Component } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';

@Component({
  selector: 'app-stripe-payment',
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.css']
})
export class StripePaymentComponent {

  constructor(
    private readonly functions: Functions
  ) { }

  testFunction() {
    const testMessage = httpsCallableData(this.functions, 'testMessage');
    testMessage({}).subscribe(r => console.log(r));
  }
}
