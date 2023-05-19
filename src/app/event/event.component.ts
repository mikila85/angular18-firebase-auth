import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { DocumentData, DocumentReference, Firestore, Timestamp, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch, CollectionReference, addDoc } from '@angular/fire/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Stripe } from 'stripe';
import { Participant } from '../models/participant.model';
import { StripeAccountLink } from '../models/stripe-account-link';
import { TeamEvent } from '../models/team-event.model';
import { TeamUser } from '../models/team-user';
import { TeamUserBrief } from '../models/team-user-brief';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubTeam } from '../models/sub-team';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  static readonly applicationFeePercentage = 5;
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private analytics: Analytics = inject(Analytics)
  selectedTabIndex: number = 0;
  user: TeamUser | null = null;
  teamEventRef: DocumentReference<DocumentData> | undefined;
  teamEvent: TeamEvent | undefined;
  eventId: string | null = null;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = (new Date()).toTimeString().substring(0, 5);
  eventTitle: string = "New Event";
  participant: Participant | undefined;
  participants: Participant[] = [];
  refusals: Participant[] = [];
  waitlist: Participant[] = [];
  stripeUrl: string = "https://stripe.com";
  //ToDo: investigate if it's possible to remove this variable and use teamEvent.eventFee instead
  eventFee: number = 0;
  isStripeAccount: boolean = false;
  isStripePrice: boolean = false;
  teamEventTeamsRef: CollectionReference<DocumentData> | undefined;
  subTeams: SubTeam[] = [];
  isFirstSubTeamDefined: boolean = false;
  teamColors = ['Red', 'White', 'Blue', 'Orange', 'Yellow', 'Green', 'Gray', 'Purple', 'Cyan', 'PapayaWhip'];
  isLoading = true;
  isStripeLoading = false;
  isPriceLoading = false;
  isActivatingStripeAccount = false;
  isOwner = false;
  isPaid: boolean | undefined = false;
  paidOn: Date | undefined = undefined;
  lastReadMessageOn: Timestamp = new Timestamp(0, 0);
  isUnreadMessage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly functions: Functions,
    private snackBar: MatSnackBar,
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
          // repeat few times until account is enabled
          this.isActivatingStripeAccount = true;
          var intervalCounter = 0;
          const getAccountInterval = setInterval(async () => {
            const account = await this.getStripeConnectedAccount(userDoc.stripeAccountId as string);
            if (account.charges_enabled && account.payouts_enabled) {
              if (this.user) {
                this.user.isStripeAccountEnabled = true;
              }
              updateDoc(doc(this.firestore, `users/${user.uid}`), {
                isStripeAccountEnabled: true,
                stripeCountry: account.country
              })
                .then(() => {
                  this.isActivatingStripeAccount = false;
                });
              clearInterval(getAccountInterval);
            }
            if (intervalCounter++ > 5) {
              this.isActivatingStripeAccount = false;
              clearInterval(getAccountInterval);
            }
          }, 3000);
        }
      }
      this.teamEventRef = doc(this.firestore, 'events', this.eventId as string);
      onSnapshot(this.teamEventRef, async (eventSnapshot) => {
        if (!eventSnapshot.exists()) {
          console.error('Event does not exist');
          this.snackBar.open('Event was deleted', 'OK', {
            duration: 5000
          });
          deleteDoc(doc(this.firestore, 'users', user.uid, 'events', this.eventId as string));
          this.router.navigate([`/`]);
        }
        this.teamEvent = eventSnapshot.data() as TeamEvent;
        this.teamEvent.id = eventSnapshot.id;
        onSnapshot(collection(this.firestore, 'events', this.eventId as string, 'participants'), (participantsSnapshot) => {
          this.participant = undefined;
          this.participants = [];
          this.refusals = [];
          this.waitlist = [];

          participantsSnapshot.docs.forEach(async (participantDoc) => {
            const p = participantDoc.data() as Participant;
            if (this.user?.uid === p.uid) {
              this.participant = p;
              this.isPaid = this.participant.isPaid;
              this.paidOn = this.participant.paidOn?.toDate();
              this.lastReadMessageOn = this.participant.lastReadMessageOn ? this.participant.lastReadMessageOn : new Timestamp(0, 0);
              const q = query(collection(this.firestore, 'events', this.eventId as string, 'messages'), orderBy('ts', 'desc'), limit(1));
              onSnapshot(q, (messageSnapshot) => {
                if (!messageSnapshot.empty && messageSnapshot.docs[0].data()['ts'] > this.lastReadMessageOn) {
                  this.isUnreadMessage = !this.isMessagesTabOpen(this.selectedTabIndex);
                }
              });
            }
            switch (p.status) {
              case 'IN':
                this.participants.push(p);
                break;
              case 'OUT':
                this.refusals.push(p);
                break;
              case 'WAITLIST':
                this.waitlist.push(p);
                break;
              default:
                console.error('Unknown participant status: ', p.status);
                break;
            }
          });
        });

        this.eventDate = (this.teamEvent.dateTime as Timestamp).toDate();
        this.eventTime = this.eventDate.toLocaleString("en-AU", { hour12: false, timeStyle: "short" });
        if (this.teamEvent.title) {
          this.eventTitle = this.teamEvent.title;
        }
        this.isOwner = this.teamEvent.owner === user.uid;

        if (this.isOwner && this.isStripeAccount && this.teamEvent.stripeAccountId !== this.user?.stripeAccountId) {
          updateDoc(this.teamEventRef as DocumentReference<DocumentData>, { stripeAccountId: this.user?.stripeAccountId });
        }
        if (this.teamEvent.eventFee) {
          this.eventFee = this.teamEvent.eventFee;
        }
        this.isStripePrice = !!this.teamEvent.stripePriceId;

        this.isLoading = false;
      });

      this.teamEventTeamsRef = collection(this.firestore, 'events', this.eventId as string, 'teams');
      onSnapshot(this.teamEventTeamsRef, async (teamsSnapshot) => {
        this.subTeams = [];
        this.isFirstSubTeamDefined = teamsSnapshot.docs.length > 0;
        teamsSnapshot.docs.forEach(async (teamDoc) => {
          const team = teamDoc.data() as SubTeam;
          team.id = teamDoc.id;
          this.subTeams.push(team);
        });
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
    const batch = writeBatch(this.firestore);
    batch.update(this.teamEventRef as DocumentReference<DocumentData>, { dateTime: this.eventDate });
    batch.update(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), { dateTime: this.eventDate });
    batch.commit();
  }

  updateEventTitle(eventTitle: string) {
    const batch = writeBatch(this.firestore);
    batch.update(this.teamEventRef as DocumentReference<DocumentData>, { title: eventTitle });
    batch.update(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), { title: eventTitle });
    batch.commit();
  }

  numberOfAttendees(): string {
    var attendeesInfo = this.participants.length.toString();
    if (this.teamEvent?.isLimitedAttendees) {
      attendeesInfo += `/${this.teamEvent.maxAttendees}`;
    }
    return attendeesInfo;
  }

  notGoing(): void {
    if (!this.user) {
      console.error("notGoing: falsy user");
      return;
    }
    logEvent(this.analytics, 'not_going', { uid: this.user.uid, eventId: this.eventId })
    const batch = writeBatch(this.firestore);
    if (this.participant) {
      batch.update(doc(this.firestore, 'events', this.eventId as string, 'participants', this.user?.uid as string), { status: 'OUT' });
    } else {
      batch.set(doc(this.firestore, 'events', this.eventId as string, 'participants', this.user?.uid as string), {
        uid: this.user.uid,
        displayName: this.user.displayName as string,
        photoURL: this.user.photoURL,
        status: 'OUT',
      });
    }
    if (!this.isOwner) {
      batch.delete(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string));
    }
    batch.commit();
    // HACK: participants array are not yet updated in firebase snapshot, so we take one participant out.
    if (this.participants.length - 1 < (this.teamEvent?.maxAttendees ?? 0)) {
      this.promoteNextPersonOnWaitlist();
    }
  }

  joinEvent(): void {
    logEvent(this.analytics, 'join_event', { uid: this.user?.uid, eventId: this.eventId })
    this.registerParticipant(<TeamUserBrief>this.user);
  }

  private registerParticipant(user: TeamUserBrief) {
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'events', this.eventId as string, 'participants', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      status: 'IN',
    });
    batch.set(doc(this.firestore, 'users', user.uid, 'events', this.eventId as string), {
      dateTime: this.eventDate,
      icon: this.teamEvent?.icon,
      title: this.eventTitle
    });
    batch.commit().catch((error) => {
      console.log(error);
    });
  }

  joinWaitlist(): void {
    logEvent(this.analytics, 'join_waitlist', { uid: this.user?.uid, eventId: this.eventId })
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'events', this.eventId as string, 'participants', this.user?.uid as string), {
      uid: this.user?.uid,
      displayName: this.user?.displayName,
      photoURL: this.user?.photoURL,
      status: 'WAITLIST',
      waitlistOn: new Date()
    });

    batch.set(doc(this.firestore, 'users', this.user?.uid as string, 'events', this.eventId as string), {
      dateTime: this.eventDate,
      icon: this.teamEvent?.icon,
      title: this.eventTitle
    });
    batch.commit().catch((error) => {
      console.log(error);
    });
  }

  promoteNextPersonOnWaitlist() {
    if (this.waitlist.length === 0) return;

    let nextOnWaitlist = this.waitlist.reduce((max, p) => (max.waitlistOn ?? 0) > (p.waitlistOn ?? 0) ? max : p);
    logEvent(this.analytics, 'promote_waitlist', { uid: this.user?.uid, promoted: nextOnWaitlist.uid, eventId: this.eventId })
    updateDoc(doc(this.firestore, 'events', this.eventId as string, 'participants', nextOnWaitlist.uid), { status: 'IN' });
  }

  eventDateTime(): string {
    return this.eventDate.toLocaleString(`en-AU`, {
      dateStyle: "full",
      timeStyle: "short"
    });
  }

  copyEventInvite() {
    logEvent(this.analytics, 'copy_invite', { uid: this.user?.uid, eventId: this.eventId })
    var eventUrl = window.location.href;
    const dateTimeOn = this.eventDateTime();

    this.clipboard.copy(`${this.eventTitle}\n${dateTimeOn}\n${eventUrl}`);

    if (navigator.share) {
      navigator.share({
        text: `${this.eventTitle}\n${dateTimeOn}`,
        url: eventUrl
      })
    }
  }

  updateEvent(data: any) {
    updateDoc(this.teamEventRef as DocumentReference<DocumentData>, data)
  }

  duplicateEvent() {
    if (!this.user) {
      console.error("duplicateEvent: user object is falsy");
      return;
    }
    logEvent(this.analytics, 'duplicate', { uid: this.user.uid, eventId: this.eventId })
    let newEventDate = new Date();
    newEventDate.setHours(this.eventDate.getHours());
    newEventDate.setMinutes(this.eventDate.getMinutes());
    if (!this.teamEvent) {
      console.error("duplicateEvent: teamEvent object is falsy");
      return;
    }
    var duplicateEvent: TeamEvent = Object.assign(this.teamEvent);
    duplicateEvent.dateTime = newEventDate;

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
    logEvent(this.analytics, 'delete_event', { uid: this.user?.uid, eventId: this.eventId })
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
    logEvent(this.analytics, 'create_stripe_account', { uid: this.user?.uid, eventId: this.eventId })
    this.isStripeLoading = true;
    const createAccount = httpsCallableData<unknown, StripeAccountLink>(this.functions, 'createStripeConnectedAccount');
    const createAccountData = {
      isTestMode: this.teamEvent?.isTestMode,
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
    logEvent(this.analytics, 'get_stripe_account', { uid: this.user?.uid, eventId: this.eventId })
    const getAccount = httpsCallableData<unknown, Stripe.Account>(this.functions, 'getStripeConnectedAccount');
    const account = await firstValueFrom(getAccount({ isTestMode: this.teamEvent?.isTestMode, id: stripeAccountId }));
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
    logEvent(this.analytics, 'create_stripe_price', { uid: this.user?.uid, eventId: this.eventId })
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
    createStripePrice({ isTestMode: this.teamEvent?.isTestMode, stripeAccount: this.user?.stripeAccountId, newPrice }).subscribe(stripePrice => {
      updateDoc(this.teamEventRef as DocumentReference<TeamEvent>, {
        stripePriceId: stripePrice.id,
        stripePriceUnitAmount: stripePrice.unit_amount ?? 0,
        eventFee: price,
        applicationFee: applicationFees,
      }).then(() => {
        this.isPriceLoading = false;
      })
    })
  }

  createStripeCheckoutSession() {
    logEvent(this.analytics, 'begin_checkout', { uid: this.user?.uid, eventId: this.eventId })
    this.isPriceLoading = true;
    const stripeCheckout = httpsCallableData<unknown, Stripe.Checkout.Session>(this.functions, 'createStripeCheckoutSession');

    const returnUrl = `${window.location.origin}/stripe-payment/${this.eventId}/${this.user?.uid}/`
    const checkoutData = {
      isTestMode: this.teamEvent?.isTestMode,
      payment: {
        mode: 'payment',
        line_items: [{ price: this.teamEvent?.stripePriceId, quantity: 1 }],
        payment_intent_data: {
          application_fee_amount: this.teamEvent?.applicationFee,
        },
        success_url: returnUrl + 'success',
        cancel_url: returnUrl + 'cancel',
      },
      connectedAccountId: this.teamEvent?.stripeAccountId
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
    if (this.isMessagesTabOpen(tabIndex) || this.isMessagesTabOpen(this.selectedTabIndex)) {
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

  updateTeamAllocations(isOn: boolean) {
    this.updateEvent({ isTeamAllocations: isOn });
    if (isOn && !this.isFirstSubTeamDefined) {
      this.isFirstSubTeamDefined = true;
      this.subTeamsAdd();
    }
  }

  subTeamsDelete(teamId: string) {
    if (!this.teamEventTeamsRef) {
      console.error("No teamEventTeamsRef");
      return;
    }
    deleteDoc(doc(this.teamEventTeamsRef, teamId))
  }

  subTeamsAdd() {
    if (!this.teamEventTeamsRef) {
      console.error("No teamEventTeamsRef");
      return;
    }
    addDoc(this.teamEventTeamsRef, { color: 'White', size: null })
  }

  subTeamsUpdate(index: number, data: any) {
    if (!this.teamEventTeamsRef) {
      console.error("No teamEventTeamsRef");
      return;
    }
    updateDoc(doc(this.teamEventTeamsRef, this.subTeams[index].id), data)
  }

  subTeamColorUpdate(color: string) {
    console.log("subTeamColorUpdate", color);
    updateDoc(doc(this.firestore, 'events', this.eventId as string, 'participants', this.participant?.uid as string),
      { teamColor: color })
  }

  /* - Feature Flag: disable for now
  sendEmailToTeam() {
    logEvent(this.analytics, 'send_email_to_team', { uid: this.user?.uid, eventId: this.eventId })
    const sendEmailToTeam = httpsCallableData<unknown, boolean>(this.functions, 'sendEmail');
    const mailOptions: MailOptions = {
      to: 'azhidkov@gmail.com',
      subject: `${this.eventTitle} ${this.eventDateTime()}`,
      text: `Hi Team,\n${this.teamEvent?.description}\nHere is the link to the event: ${window.location.origin}/event/${this.eventId}\n\nRegards,\n${this.user?.displayName}`,
      html: `<p>Hi Team,</p>
      <p>${this.teamEvent?.description}</p>
      <p>Here is the link to the event: <a href="${window.location.origin}/event/${this.eventId}">${window.location.origin}/event/${this.eventId}</a></p>
      <p>Regards,</p>
      <p>${this.user?.displayName}</p>`
    }

    sendEmailToTeam(mailOptions).subscribe(r => {
      console.log("sendEmailToTeam:", r);
    })
  }
  */
}
