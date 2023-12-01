import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Firestore, doc, getDoc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamUserBrief } from '../models/team-user-brief';
import { TeamEventBrief } from '../models/team-event-brief.model';

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
  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.userId = this.route.snapshot.paramMap.get('userId');
    var successParam = this.route.snapshot.paramMap.get('success');
    if (this.eventId === null || this.userId === null) {
      console.error("eventId or userId is NULL");
      this.router.navigate(['/']);
    }
    var isRegisterParticipant = successParam === 'register';
    this.isSuccess = isRegisterParticipant || successParam === 'success';
    if (isRegisterParticipant) {
      await this.registerParticipant(await this.getParticipant());
      this.navigateToEvent();
    } else {
      if (this.isSuccess) {
        logEvent(this.analytics, 'stripe_checkout_completed', { uid: this.userId, eventId: this.eventId });
        updateDoc(doc(this.firestore, 'events', this.eventId as string, 'participants', this.userId as string), {
          isPaid: true,
          paidOn: new Date(),
        })
          .then(() => this.navigateToEvent());
      } else {
        logEvent(this.analytics, 'stripe_checkout_failed', { uid: this.userId, eventId: this.eventId });
        console.error(`Payment failed: eventId = ${this.eventId}, userId = ${this.userId}`);
      }
    }
  }

  async getParticipant(): Promise<TeamUserBrief> {
    const userSnapshot = await getDoc(doc(this.firestore, `users/${this.userId}`));
    const userDoc = userSnapshot.data() as TeamUserBrief;
    return userDoc;
  }

  async getEvent(): Promise<TeamEventBrief> {
    const userSnapshot = await getDoc(doc(this.firestore, `events/${this.eventId}`));
    const eventDoc = userSnapshot.data() as TeamEventBrief;
    return eventDoc;
  }

  // ToDo: this is duplicated from event.component.ts
  private async registerParticipant(user: TeamUserBrief) {
    var currentTime = new Date();
    var teamEvent = await this.getEvent();
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'events', this.eventId as string, 'participants', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      status: 'IN',
      actedOn: currentTime,
      isPaid: true,
      paidOn: currentTime
    });
    batch.set(doc(this.firestore, 'users', user.uid, 'events', this.eventId as string), {
      dateTime: teamEvent.dateTime,
      icon: teamEvent.icon,
      title: teamEvent.title
    });
    batch.commit().catch((error) => {
      console.log(error);
    });
  }

  navigateToEvent() {
    this.router.navigate([`/event/${this.eventId}`], { replaceUrl: true });
  }
}
