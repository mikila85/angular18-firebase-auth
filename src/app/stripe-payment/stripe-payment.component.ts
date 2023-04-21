import { Component, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Functions, httpsCallableData } from '@angular/fire/functions';

@Component({
  selector: 'app-stripe-payment',
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.css']
})
export class StripePaymentComponent {
  @Input() user: User | null = null;

  constructor(
    private readonly functions: Functions
  ) { }

  testFunction() {
    const testMessage = httpsCallableData(this.functions, 'testMessage');
    testMessage({}).subscribe(r => console.log(r));
  }

  createStripeConnectedAccount() {
    const createAccount = httpsCallableData(this.functions, 'createStripeConnectedAccount');
    const getAccount = httpsCallableData(this.functions, 'getStripeConnectedAccount');

    createAccount({ email: this.user?.email }).subscribe(accountLink => {
      console.log(accountLink);
      getAccount({ id: 'acct_1Mp1W8ChOdz0IfUW' }).subscribe(account => {
        console.log(account);
      })
    })
  }

  deleteStripeTestConnectedAccount() {
    const getAccount = httpsCallableData(this.functions, 'getStripeConnectedAccount');
    getAccount({ id: 'acct_1Mp1W8ChOdz0IfUW' }).subscribe(account => {
      console.log(account);
    })
  }
}
