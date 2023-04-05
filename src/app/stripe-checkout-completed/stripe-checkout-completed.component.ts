import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stripe-checkout-completed',
  templateUrl: './stripe-checkout-completed.component.html',
  styleUrls: ['./stripe-checkout-completed.component.css']
})
export class StripeCheckoutCompletedComponent {
  eventId: string | null = null;
  userId: string | null = null;
  isSuccess: boolean = true;

  constructor(
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  // update participant in event doc in firebase with payment info
  // navigate back to Event page 
  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.userId = this.route.snapshot.paramMap.get('userId');
    this.isSuccess = this.route.snapshot.paramMap.get('success') === 'success';
    if (this.isSuccess) {
      this.afs.doc(`events/${this.eventId}/participants/${this.userId}`)
        .update({
          isPaid: true,
          paidOn: new Date(),
        })
        .then(() => { this.router.navigate(['/event', { eventId: this.eventId }]) });
    } else {
      console.error(`Payment failed: eventId = ${this.eventId}, userId = ${this.userId}`);
    }
  }

  navigateToEvent() {
    this.router.navigate(['/event', { eventId: this.eventId }]);
  }
}
