import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stripe-checkout-completed',
  templateUrl: './stripe-checkout-completed.component.html',
  styleUrls: ['./stripe-checkout-completed.component.css']
})
export class StripeCheckoutCompletedComponent {
  private firestore: Firestore = inject(Firestore);
  private analytics: Analytics = inject(Analytics);
  eventId: string | null = null;
  userId: string | null = null;
  isSuccess: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  // update participant in event doc in firebase with payment info
  // navigate back to Event page 
  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.userId = this.route.snapshot.paramMap.get('userId');
    this.isSuccess = this.route.snapshot.paramMap.get('success') === 'success';
    if (this.eventId === null || this.userId === null) {
      console.error("eventId or userId is NULL");
      this.router.navigate(['/']);
    }
    if (this.isSuccess) {
      logEvent(this.analytics, 'stripe_checkout_completed', { uid: this.userId, eventId: this.eventId });
      updateDoc(doc(this.firestore, 'events', this.eventId as string, 'participants', this.userId as string), {
        isPaid: true,
        paidOn: new Date(),
      })
        .then(() => { this.router.navigate([`/event/${this.eventId}`]) });
    } else {
      logEvent(this.analytics, 'stripe_checkout_failed', { uid: this.userId, eventId: this.eventId });
      console.error(`Payment failed: eventId = ${this.eventId}, userId = ${this.userId}`);
    }
  }

  navigateToEvent() {
    this.router.navigate([`/event/${this.eventId}`]);
  }
}
