import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, take } from 'rxjs';
import { Stripe } from 'stripe';
import { StripeAccountLink } from '../models/stripe-account-link';
import { TeamEventBrief } from '../models/team-event-brief.model';
import { TeamEvent } from '../models/team-event.model';
import { TeamUser } from '../models/team-user';
import { TeamUserBrief } from '../models/team-user-brief';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  user: TeamUser | null = null;
  teamEventDoc: AngularFirestoreDocument<TeamEvent> | undefined;
  teamEvent: Observable<TeamEvent | undefined> | undefined;
  eventId: string | null = null;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = (new Date()).toTimeString().substring(0, 5);
  eventTitle: string = "New Event";
  eventDescription: string = "";
  eventIcon: string | null = null;
  isLimitedAttendees: boolean = false;
  isTeamAllocations: boolean = false;
  isEventFee: boolean = false;
  isStripeAccount: boolean = false;
  isStripePrice: boolean = false;
  price: number = 0;
  stripePriceUnitAmount: number = 0;
  stripePriceId: string | undefined;
  maxAttendees: number | undefined;
  teamColors = ['Red', 'White', 'Blue', 'Orange', 'Yellow', 'Green', 'Gray'];
  teams: { color: string, size: number }[] = [{ color: 'Red', size: 0 }]
  numberOfParticipants: number = 0;
  waitlist: TeamUserBrief[] = [];
  isLoading = true;
  isStripeLoading = false;
  isPriceLoading = false;
  isNewEvent = true;
  isOwner = false;
  isJoined = false;
  isWaitlist = false;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    private readonly functions: Functions,
    private clipboard: Clipboard,
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.auth.user.subscribe(user => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.user = user;
      this.afs.doc<TeamUser>(`users/${user.uid}`).valueChanges().subscribe(u => {
        if (!u || !this.user) {
          console.error("ngOnInit userDoc.subscribe: returned falsy user");
          return;
        }
        this.user.stripeAccountId = u.stripeAccountId;
        this.isStripeAccount = true;
      });

      if (this.eventId) {
        this.isNewEvent = false;
        this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
        this.teamEvent = this.teamEventDoc.valueChanges({ idField: 'id' });
        this.afs.doc(`events/${this.eventId}/participants/${this.user.uid}`)
          .get().subscribe(p => {
            this.isJoined = p.exists;
          });
        this.afs.doc(`events/${this.eventId}/waitlist/${this.user.uid}`)
          .get().subscribe(p => {
            this.isWaitlist = p.exists;
          });
      }
      else {
        console.log('New Event');
        this.isOwner = true;
        const batch = this.afs.firestore.batch();
        this.eventId = this.afs.createId();

        batch.set(this.afs.doc(`events/${this.eventId}`).ref, {
          owner: user.uid,
          dateTime: this.eventDate,
          icon: user.photoURL,
          isLimitedAttendees: false
        });

        batch.set(this.afs.doc<TeamEventBrief>(`users/${user.uid}/events/${this.eventId}`).ref, {
          dateTime: this.eventDate,
          icon: user.photoURL,
          title: this.eventTitle
        });

        batch.commit().then(() => {
          this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
          this.teamEvent = this.teamEventDoc.valueChanges();
          this.isLoading = false;
        });
      }
      this.teamEvent?.subscribe(te => {
        if (!te) {
          console.error("ngOnInit teamEvent.subscribe: returned falsy team event")
          return
        }
        this.eventDate = (te.dateTime as firebase.default.firestore.Timestamp).toDate();
        this.eventTime = this.eventDate.toLocaleString("en-AU", { hour12: false, timeStyle: "short" });
        this.eventTitle = te.title;
        this.eventDescription = te.description;
        this.eventIcon = te.icon;
        this.isLimitedAttendees = te.isLimitedAttendees;
        this.maxAttendees = te.maxAttendees;
        this.isTeamAllocations = te.isTeamAllocations;
        this.isEventFee = te.isEventFee
        this.isOwner = te.owner === user.uid;
        this.isLoading = false;
        this.isStripePrice = !!te.stripePriceId;
        this.stripePriceId = te.stripePriceId;
        if (te.stripePriceUnitAmount) {
          this.stripePriceUnitAmount = te.stripePriceUnitAmount;
        }
        if (te.stripePriceUnitAmount) {
          this.price = te.stripePriceUnitAmount / 100;
        }
      });

      this.getWaitlist();
    });
  }

  updateEventDate(date: Date): void {
    this.eventDate = date;
    this.updateEventDateTime();
  }

  updateEventTime(time: string): void {
    this.eventTime = time;
    this.updateEventDateTime();
  }

  updateEventDateTime(): void {
    if (!(this.eventDate && this.eventTime)) return;

    this.eventDate.setHours(Number(this.eventTime.substring(0, 2)));
    this.eventDate.setMinutes(Number(this.eventTime.substring(3, 5)));
    this.teamEventDoc?.update({ dateTime: this.eventDate });
  }

  numberOfAttendees(): string {
    var attendeesInfo = this.numberOfParticipants.toString();
    if (this.isLimitedAttendees) {
      attendeesInfo += `/${this.maxAttendees}`;
    }
    return attendeesInfo;
  }

  joinEvent(): void {
    if (this.isWaitlist && !this.isJoined) {
      // Must be on waitlist and wants to leave waitlist.
      this.joinWaitlist();
      return;
    }
    if (this.isJoined) {
      const batch = this.afs.firestore.batch();
      batch.delete(this.afs.doc(`events/${this.eventId}/participants/${this.user?.uid}`).ref);
      if (!this.isOwner) {
        batch.delete(this.afs.doc(`users/${this.user?.uid}/events/${this.eventId}`).ref);
      }
      batch.commit();
      this.promoteNextPersonOnWaitlist();
    } else {
      this.teamEvent?.subscribe(teamEvent => {
        if (!teamEvent) {
          console.error("joinEvent: teamEvent is falsy")
          return
        }
        this.registerParticipant(<TeamUserBrief>this.user);
      })
    }
    this.isJoined = !this.isJoined;
  }

  private registerParticipant(user: TeamUserBrief) {
    const batch = this.afs.firestore.batch();
    batch.set(this.afs.collection(`events/${this.eventId}/participants`)
      .doc(user.uid).ref, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    batch.set(this.afs.collection<TeamEventBrief>(`users/${this.user?.uid}/events`)
      .doc(this.eventId ? this.eventId : undefined).ref, {
      dateTime: this.eventDate,
      icon: this.eventIcon,
      title: this.eventTitle
    });
    batch.commit();
  }

  joinWaitlist(): void {
    if (this.isWaitlist) {
      const batch = this.afs.firestore.batch();
      batch.delete(this.afs.doc(`events/${this.eventId}/waitlist/${this.user?.uid}`).ref);
      if (!this.isOwner) {
        batch.delete(this.afs.doc(`users/${this.user?.uid}/events/${this.eventId}`).ref);
      }
      batch.commit();
    } else {
      const batch = this.afs.firestore.batch();
      batch.set(this.afs.collection(`events/${this.eventId}/waitlist`)
        .doc(this.user?.uid).ref, {
        uid: this.user?.uid,
        displayName: this.user?.displayName,
        photoURL: this.user?.photoURL,
        ts: new Date()
      });

      batch.set(this.afs.collection<TeamEventBrief>(`users/${this.user?.uid}/events`)
        .doc(this.eventId ? this.eventId : undefined).ref, {
        dateTime: this.eventDate,
        icon: this.eventIcon,
        title: this.eventTitle
      });

      batch.commit()
        .then(result => console.info("batch.commit() succeeded:", result))
        .catch(error => console.error("batch.commit() failed:", error))
    }
    this.isWaitlist = !this.isWaitlist;
  }

  promoteNextPersonOnWaitlist() {
    this.afs.collection<TeamUserBrief>(`events/${this.eventId}/waitlist`, ref => ref.orderBy('ts', 'asc'))
      .valueChanges({ idField: 'uid' })
      .pipe(take(1)).subscribe(firstInWaitlist => {
        if (firstInWaitlist.length > 0) {
          this.registerParticipant(firstInWaitlist[0]);
          this.afs.doc<TeamUserBrief>(`events/${this.eventId}/waitlist/${firstInWaitlist[0].uid}`).delete();
        }
      });
  }

  getWaitlist() {
    this.afs.collection<TeamUserBrief>(`/events/${this.eventId}/waitlist`)
      .valueChanges()
      .subscribe((w) => this.waitlist = w)
  }

  copyEventInvite() {
    var eventUrl = window.location.href;
    if (this.isNewEvent) {
      eventUrl += `/${this.eventId}`;
    }
    var message = `${this.eventTitle}\n${this.eventDate.toLocaleString(`en-AU`, {
      dateStyle: "full",
      timeStyle: "short"
    })}\n${eventUrl}`;

    this.clipboard.copy(message);
  }

  duplicateEvent() {
    if (!this.user) {
      console.error("duplicateEvent: user object is falsy");
      return;
    }
    let newEventDate = new Date();
    newEventDate.setHours(this.eventDate.getHours());
    newEventDate.setMinutes(this.eventDate.getMinutes());
    var duplicateEvent: TeamEvent = {
      title: this.eventTitle,
      description: this.eventDescription ? this.eventDescription : "",
      dateTime: newEventDate,
      owner: this.user.uid,
      icon: this.user.photoURL,
      isLimitedAttendees: this.isLimitedAttendees,
      isTeamAllocations: this.isTeamAllocations,
      isEventFee: this.isEventFee,
      maxAttendees: this.maxAttendees,
      stripePriceId: this.stripePriceId,
      stripePriceUnitAmount: this.stripePriceUnitAmount,
    };
    if (this.maxAttendees) {
      duplicateEvent.maxAttendees = this.maxAttendees;
    }
    this.afs.collection<TeamEvent>('events').add(duplicateEvent).then(ref => {
      if (!this.user) {
        console.error("duplicateEvent: user object is falsy");
        return;
      }
      this.afs.doc<TeamEventBrief>(`users/${this.user.uid}/events/${ref.id}`).set({
        dateTime: newEventDate,
        icon: this.user.photoURL,
        title: this.eventTitle
      });
      this.router.navigate([`event/${ref.id}`]).then(() => {
        window.location.reload();
      });;
    })
  }

  deleteEvent(): void {
    if (!this.teamEventDoc) {
      console.error("deleteEvent: falsy teamEventDoc");
      return;
    }
    const batch = this.afs.firestore.batch();
    batch.delete(this.teamEventDoc.ref)
    batch.delete(this.afs.doc(`users/${this.user?.uid}/events/${this.eventId}`).ref)
    batch.commit().then(() => { this.router.navigate([`/`]) });
  }

  createStripeConnectedAccount() {
    this.isStripeLoading = true;
    const createAccount = httpsCallableData<unknown, StripeAccountLink>(this.functions, 'createStripeConnectedAccount');
    const createAccountData = {
      accountType: 'standard',
      email: this.user?.email,
      businessProfileUrl: `https://team-bldr.web.app/profile/${this.user?.uid}`,
      refreshUrl: window.location.href,
      returnUrl: `${window.location.origin}/stripe/${this.eventId}/`
    }
    createAccount(createAccountData).subscribe((accountLink: StripeAccountLink) => {
      console.log(accountLink);
      window.open(accountLink.url, '_self', '')
      this.isStripeLoading = false;
    })
  }

  getStripeConnectedAccount(stripeAccountId: string) {
    this.isStripeLoading = true;
    const getAccount = httpsCallableData(this.functions, 'getStripeConnectedAccount');

    getAccount({ id: stripeAccountId }).subscribe(account => {
      console.log(account);
    })
  }

  createStripePrice(price: number) {
    this.isPriceLoading = true;
    const priceWithStripeFees = Math.ceil((price * 1.031 + 0.3) * 100);
    const applicationFees = 50;
    const priceTotal = priceWithStripeFees + applicationFees;
    const stripePrice = httpsCallableData<unknown, Stripe.Price>(this.functions, 'createStripePrice');

    stripePrice({
      unit_amount: priceTotal,
      currency: 'aud',
      product_data: {
        name: this.eventTitle
      }
    }).subscribe(stripePrice => {
      this.stripePriceId = stripePrice.id;
      if (stripePrice.unit_amount) {
        this.stripePriceUnitAmount = stripePrice.unit_amount;
      } else {
        this.stripePriceUnitAmount = 0;
      }
      this.teamEventDoc?.update({
        stripePriceId: stripePrice.id,
        stripePriceUnitAmount: this.stripePriceUnitAmount
      }).then(() => {
        this.isPriceLoading = false;
      })
    })
  }

  createStripeCheckoutSession() {
    this.isPriceLoading = true;
    const stripeCheckout = httpsCallableData<unknown, Stripe.Checkout.Session>(this.functions, 'createStripeCheckoutSession');

    const checkoutData = {
      payment: {
        mode: 'payment',
        line_items: [{ price: this.stripePriceId, quantity: 1 }],
        payment_intent_data: {
          application_fee_amount: 50,
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      },
      connectedAccountId: this.user?.stripeAccountId
    }
    stripeCheckout(checkoutData).subscribe(r => {
      this.isPriceLoading = false;
      console.log(r);
      if (r.url) {
        window.open(r.url, '_blank', '')
      } else {
        console.error("No URL returned by createStripeCheckoutSession")
      }
    })
  }
}
