import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, Timestamp, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from '@angular/fire/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Stripe } from 'stripe';
import { Participant } from '../models/participant.model';
import { StripeAccountLink } from '../models/stripe-account-link';
import { TeamEvent } from '../models/team-event.model';
import { TeamUser } from '../models/team-user';
import { TeamUserBrief } from '../models/team-user-brief';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  static readonly applicationFeePercentage = 5;
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  selectedTabIndex: number = 0;
  user: TeamUser | null = null;
  teamEventRef: DocumentReference<DocumentData> | undefined;
  teamEvent: TeamEvent | undefined;
  eventId: string | null = null;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = (new Date()).toTimeString().substring(0, 5);
  eventTitle: string = "New Event";
  eventDescription: string = "";
  eventIcon: string | null = null;
  isLimitedAttendees: boolean = false;
  isTeamAllocations: boolean = false;
  stripeUrl: string = "https://stripe.com";
  isEventFee: boolean = false;
  isTestMode: boolean = false;
  eventFee: number = 0;
  applicationFee: number = 0;
  isStripeAccount: boolean = false;
  isStripePrice: boolean = false;
  stripeAccountId: string | undefined;
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
  isOwner = false;
  isJoined = false;
  isWaitlist = false;
  isPaid: boolean | undefined = false;
  paidOn: Date | undefined = undefined;
  lastReadMessageOn: Timestamp = new Timestamp(0, 0);
  isUnreadMessage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly functions: Functions,
    private clipboard: Clipboard,
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    if (!this.eventId) {
      console.error('Event ID is falsy');
      return;
    }
    this.selectedTabIndex = Number(localStorage.getItem('selectedTabIndex'));
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.user = Object.assign(user);
      const userSnapshot = await getDoc(doc(this.firestore, `users/${user.uid}`));
      const userDoc = userSnapshot.data() as TeamUser;
      if (!userDoc || !this.user) {
        console.error("ngOnInit userDoc.subscribe: returned falsy user");
        return;
      }
      this.user.isStripeAccountEnabled = userDoc.isStripeAccountEnabled;
      this.user.isTester = userDoc.isTester;
      if (userDoc.stripeAccountId) {
        this.user.stripeAccountId = userDoc.stripeAccountId;
        this.stripeUrl = "https://dashboard.stripe.com";
        this.isStripeAccount = true;
        if (!userDoc.isStripeAccountEnabled) {
          const account = await this.getStripeConnectedAccount(userDoc.stripeAccountId);
          if (account.charges_enabled && account.payouts_enabled) {
            updateDoc(doc(this.firestore, `users/${user.uid}`), { isStripeAccountEnabled: true });
          }
        }
      }

      this.teamEventRef = doc(this.firestore, 'events', this.eventId as string);
      onSnapshot(this.teamEventRef, async (eventSnapshot) => {
        if (!eventSnapshot.exists()) {
          console.error('Event does not exist');
          return;
        }
        this.teamEvent = eventSnapshot.data() as TeamEvent;
        this.teamEvent.id = eventSnapshot.id;
        const participantSnapshot = await getDoc(doc(this.firestore, `events/${this.eventId}/participants/${this.user?.uid}`));
        this.isJoined = participantSnapshot.exists();
        if (this.isJoined) {
          const participantData = participantSnapshot.data() as Participant;
          if (!participantData) {
            console.error("ngOnInit participantSnapshot.data() returned falsy participantData");
            return;
          }
          this.isPaid = participantData.isPaid;
          this.paidOn = participantData.paidOn?.toDate();
          this.lastReadMessageOn = participantData.lastReadMessageOn ? participantData.lastReadMessageOn : new Timestamp(0, 0);
          const q = query(collection(this.firestore, 'events', this.eventId as string, 'messages'), orderBy('ts', 'desc'), limit(1));
          onSnapshot(q, (messageSnapshot) => {
            if (messageSnapshot.docs[0].data()['ts'] > this.lastReadMessageOn) {
              this.isUnreadMessage = !this.isMessagesTabOpen(this.selectedTabIndex);
            }
          });
        }

        onSnapshot(doc(this.firestore, 'events', this.eventId as string, 'waitlist', this.user?.uid as string), (waitlistSnapshot) => {
          this.isWaitlist = waitlistSnapshot.exists();
        });

        this.eventDate = (this.teamEvent.dateTime as Timestamp).toDate();
        this.eventTime = this.eventDate.toLocaleString("en-AU", { hour12: false, timeStyle: "short" });
        if (this.teamEvent.title) {
          this.eventTitle = this.teamEvent.title;
        }
        this.eventDescription = this.teamEvent.description;
        this.eventIcon = this.teamEvent.icon;
        this.isLimitedAttendees = this.teamEvent.isLimitedAttendees;
        this.maxAttendees = this.teamEvent.maxAttendees;
        this.isTeamAllocations = this.teamEvent.isTeamAllocations;
        this.isEventFee = this.teamEvent.isEventFee
        if (this.teamEvent.isTestMode) {
          this.isTestMode = this.teamEvent.isTestMode
        }
        this.isOwner = this.teamEvent.owner === user.uid;

        this.stripeAccountId = this.teamEvent.stripeAccountId;
        if (this.isOwner && this.isStripeAccount && this.teamEvent.stripeAccountId !== this.user?.stripeAccountId) {
          this.stripeAccountId = this.user?.stripeAccountId;
          updateDoc(this.teamEventRef as DocumentReference<DocumentData>, { stripeAccountId: this.user?.stripeAccountId });
        }
        if (this.teamEvent.eventFee) {
          this.eventFee = this.teamEvent.eventFee;
        }
        if (this.teamEvent.applicationFee) {
          this.applicationFee = this.teamEvent.applicationFee;
        }
        this.isStripePrice = !!this.teamEvent.stripePriceId;
        this.stripePriceId = this.teamEvent.stripePriceId;
        if (this.teamEvent.stripePriceUnitAmount) {
          this.stripePriceUnitAmount = this.teamEvent.stripePriceUnitAmount;
        }

        this.getWaitlist();
        this.isLoading = false;
      });
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
    // ToDo - use batch update
    updateDoc(this.teamEventRef as DocumentReference<DocumentData>, { dateTime: this.eventDate });
    //ToDo - refactor userEventRef to be a property
    updateDoc(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), { dateTime: this.eventDate });
  }

  updateEventTitle(eventTitle: string) {
    updateDoc(this.teamEventRef as DocumentReference<DocumentData>, { title: eventTitle });
    //ToDo - refactor userEventRef to be a property
    updateDoc(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), { title: eventTitle });
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
      const batch = writeBatch(this.firestore);
      batch.delete(doc(this.firestore, 'events', this.eventId as string, 'participants', this.user?.uid as string));
      if (!this.isOwner) {
        batch.delete(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string));
      }
      batch.commit();
      this.promoteNextPersonOnWaitlist();
    } else {
      this.registerParticipant(<TeamUserBrief>this.user);
    }
    this.isJoined = !this.isJoined;
  }

  private registerParticipant(user: TeamUserBrief) {
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'events', this.eventId as string, 'participants', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    batch.set(doc(this.firestore, 'users', user.uid, 'events', this.eventId as string), {
      dateTime: this.eventDate,
      icon: this.eventIcon,
      title: this.eventTitle
    });
    batch.commit();
  }

  joinWaitlist(): void {
    const batch = writeBatch(this.firestore);
    if (this.isWaitlist) {
      batch.delete(doc(this.firestore, 'events', this.eventId as string, 'waitlist', this.user?.uid as string));
      if (!this.isOwner) {
        batch.delete(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string));
      }
    } else {
      batch.set(doc(this.firestore, 'events', this.eventId as string, 'waitlist', this.user?.uid as string), {
        uid: this.user?.uid,
        displayName: this.user?.displayName,
        photoURL: this.user?.photoURL,
        ts: new Date()
      });

      batch.set(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), {
        dateTime: this.eventDate,
        icon: this.eventIcon,
        title: this.eventTitle
      });
    }
    batch.commit()
    this.isWaitlist = !this.isWaitlist;
  }

  promoteNextPersonOnWaitlist() {
    const q = query(collection(this.firestore, 'events', this.eventId as string, 'waitlist'), orderBy('ts', 'asc'), limit(1));
    onSnapshot(q, (firstInWaitlist) => {
      if (!firstInWaitlist.empty) {
        this.registerParticipant(firstInWaitlist.docs[0].data() as TeamUserBrief);
        deleteDoc(doc(this.firestore, 'events', this.eventId as string, 'waitlist', firstInWaitlist.docs[0].data()['uid']));
      }
    });
  }

  getWaitlist() {
    onSnapshot(collection(this.firestore, `events/${this.eventId}/waitlist`), (querySnapshot) => {
      this.waitlist = querySnapshot.docs.map(doc => doc.data() as TeamUserBrief);
    });
  }

  copyEventInvite() {
    var eventUrl = window.location.href;
    var message = `${this.eventTitle}\n${this.eventDate.toLocaleString(`en-AU`, {
      dateStyle: "full",
      timeStyle: "short"
    })}\n${eventUrl}`;

    this.clipboard.copy(message);
  }

  updateEvent(data: any) {
    updateDoc(this.teamEventRef as DocumentReference<DocumentData>, data)
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
      eventFee: this.eventFee,
      applicationFee: this.applicationFee,
      maxAttendees: this.maxAttendees,
      stripePriceId: this.stripePriceId,
      stripePriceUnitAmount: this.stripePriceUnitAmount,
    };
    if (this.isTestMode) {
      duplicateEvent.isTestMode = this.isTestMode;
    }
    if (this.maxAttendees) {
      duplicateEvent.maxAttendees = this.maxAttendees;
    }

    const newEventId = doc(collection(this.firestore, 'events')).id;
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'events', newEventId), duplicateEvent);
    batch.set(doc(this.firestore, 'users', this.user?.uid as string, 'events', newEventId), {
      dateTime: newEventDate,
      icon: this.user.photoURL,
      title: this.eventTitle
    });
    batch.commit().then(() => {
      this.router.navigate([`event/${newEventId}`]).then(() => {
        window.location.reload();
      });
    })
  }

  deleteEvent(): void {
    if (!this.teamEventRef) {
      console.error("deleteEvent: falsy teamEventDoc");
      return;
    }
    const batch = writeBatch(this.firestore);
    batch.delete(this.teamEventRef)
    batch.delete(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string));
    batch.commit().then(() => { this.router.navigate([`/`]) });
  }

  createStripeConnectedAccount() {
    this.isStripeLoading = true;
    const createAccount = httpsCallableData<unknown, StripeAccountLink>(this.functions, 'createStripeConnectedAccount');
    const createAccountData = {
      isTestMode: this.isTestMode,
      accountType: 'standard',
      email: this.user?.email,
      businessProfileUrl: `https://team-bldr.web.app/profile/${this.user?.uid}`,
      refreshUrl: window.location.href,
      returnUrl: `${window.location.origin}/stripe/${this.eventId}/`
    }
    createAccount(createAccountData).subscribe((accountLink: StripeAccountLink) => {
      window.open(accountLink.url, '_self', '')
      this.isStripeLoading = false;
    })
  }

  async getStripeConnectedAccount(stripeAccountId: string) {
    const getAccount = httpsCallableData<unknown, Stripe.Account>(this.functions, 'getStripeConnectedAccount');
    const account = await firstValueFrom(getAccount({ isTestMode: this.isTestMode, id: stripeAccountId }));
    return account;
  }

  /** The sample computation based on the following values:
    $10.00 = Expected payout for the Connect account
    $0.50 = Application fee
    1.75% or 0.0175 = Stripe fixed percentage fee (Domestic card)
    $0.30 = Stripe fixed fee
   
    Step 1: $10.00 + $0.30 = $10.30
    Step 2: 1 - 0.0175 = 0.9825
    Step 3: $10.30 / 0.9825 = $10.48
    Step 4: $10.48 + $0.50 = $11.98 Total amount to be charged
   
    After getting the Total charge, you can already follow the Flow of funds in this link:
    https://stripe.com/docs/connect/destination-charges#flow-of-funds-app-fee
  */
  createStripePrice(price: number) {
    this.isPriceLoading = true;
    const priceWithStripeFees = Math.ceil((price * 100 + 30) / (1 - 0.0175));
    const tax = Math.ceil((priceWithStripeFees - (price * 100)) / 10);
    const applicationFees = Math.trunc(price * EventComponent.applicationFeePercentage);
    const priceTotal = priceWithStripeFees + applicationFees + tax;
    const createStripePrice = httpsCallableData<unknown, Stripe.Price>(this.functions, 'createStripePrice');

    const newPrice = {
      unit_amount: priceTotal,
      currency: 'aud',
      product_data: {
        name: this.eventTitle
      }
    }
    createStripePrice({ isTestMode: this.isTestMode, stripeAccount: this.user?.stripeAccountId, newPrice }).subscribe(stripePrice => {
      this.stripePriceId = stripePrice.id;
      if (stripePrice.unit_amount) {
        this.stripePriceUnitAmount = stripePrice.unit_amount;
      } else {
        this.stripePriceUnitAmount = 0;
      }
      updateDoc(this.teamEventRef as DocumentReference<TeamEvent>, {
        stripePriceId: stripePrice.id,
        stripePriceUnitAmount: this.stripePriceUnitAmount,
        eventFee: price,
        applicationFee: applicationFees,
      }).then(() => {
        this.applicationFee = applicationFees;
        this.isPriceLoading = false;
      })
    })
  }

  createStripeCheckoutSession() {
    this.isPriceLoading = true;
    const stripeCheckout = httpsCallableData<unknown, Stripe.Checkout.Session>(this.functions, 'createStripeCheckoutSession');

    const returnUrl = `${window.location.origin}/stripe-payment/${this.eventId}/${this.user?.uid}/`
    const checkoutData = {
      isTestMode: this.isTestMode,
      payment: {
        mode: 'payment',
        line_items: [{ price: this.stripePriceId, quantity: 1 }],
        payment_intent_data: {
          application_fee_amount: this.applicationFee,
        },
        success_url: returnUrl + 'success',
        cancel_url: returnUrl + 'cancel',
      },
      connectedAccountId: this.stripeAccountId
    }
    stripeCheckout(checkoutData).subscribe(r => {
      this.isPriceLoading = false;
      if (r.url) {
        window.open(r.url, '_blank', '')
      } else {
        console.error("No URL returned by createStripeCheckoutSession")
        console.log(r);
      }
    })
  }

  storeSelectedTabIndex(tabIndex: number) {
    if (this.isMessagesTabOpen(tabIndex)) {
      this.isUnreadMessage = false;
      this.lastReadMessageOn = Timestamp.now();
      updateDoc(doc(this.firestore, 'events', this.eventId as string, 'participants', this.user?.uid as string), { lastReadMessageOn: this.lastReadMessageOn });
    }
    this.selectedTabIndex = tabIndex;
    localStorage.setItem('selectedTabIndex', this.selectedTabIndex.toString());
  }

  isMessagesTabOpen(tabIndex: number): boolean {
    const messagesTabIndex = this.waitlist.length > 0 ? 2 : 1;
    return tabIndex === messagesTabIndex;
  }
}
