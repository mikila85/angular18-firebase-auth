import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Stripe } from 'stripe';
import { Participant } from '../models/participant.model';
import { StripeAccountLink } from '../models/stripe-account-link';
import { SubTeam } from '../models/sub-team';

@Component({
  selector: 'app-demo-event',
  templateUrl: './demo-event.component.html',
  styleUrls: ['./demo-event.component.css']
})
export class DemoEventComponent implements OnInit {
  private analytics: Analytics = inject(Analytics)
  eventId: string = '';
  eventTitle: string = '';
  isOwner: boolean = false;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = (new Date()).toTimeString().substring(0, 5);
  title: string = '';
  description: string = '';
  location: string = '';
  mapsUrl: string = '';
  isLimitedAttendees: boolean = false;
  maxAttendees: number = 0;
  isTeamAllocations: boolean = false;
  subTeams: SubTeam[] = [];
  teamColors = ['Red', 'White', 'Blue', 'Orange', 'Yellow', 'Green', 'Gray', 'Purple', 'Cyan', 'PapayaWhip'];
  isFirstSubTeamDefined: boolean = false;
  isEventFee = false;
  stripeUrl: string = "https://stripe.com";
  isStripeAccount: boolean = false;
  isActivatingStripeAccount: boolean = false;
  isStripeAccountEnabled: boolean = false;
  isStripePrice: boolean = false;
  stripePriceUnitAmount: number = 1000;
  isPaid: boolean = false;
  paidOn: Date = new Date();
  isUnreadMessage: boolean = false;
  participant: Participant = { uid: 'DEMO', displayName: 'DEMO person', photoURL: './../../assets/icons/favicon-32x32.png' };
  participants: Participant[] = [];
  refusals: Participant[] = [];
  waitlist: Participant[] = [];
  isPriceLoading = false;

  constructor(
    private route: ActivatedRoute,
    private readonly functions: Functions,
    private router: Router,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
    this.isPaid = (this.route.snapshot.queryParamMap.get('isPaid') === 'true');

    const now: Date = new Date();
    switch (this.eventId) {
      case 'new':
        this.isOwner = true;
        break;
      case '1':
        this.eventTitle = $localize`Sunday Breakfast with friends`;
        this.description = $localize`Let's have a nice breakfast by the ocean together this Sunday!`;
        this.eventDate = new Date(now.setDate(now.getDate() + 7 - now.getDay()));
        this.eventDate.setHours(9);
        this.eventDate.setMinutes(0);
        this.location = 'The Kiosk Floreat Beach';
        this.mapsUrl = 'https://goo.gl/maps/zQWpL9M9Vte9uYGb7';
        this.participants = [
          { uid: 'DEMO1', displayName: $localize`Anna Webber`, photoURL: './../../assets/demo-person1.jpg', status: 'IN' },
          { uid: 'DEMO2', displayName: $localize`Jack`, photoURL: './../../assets/demo-person2.jpg', status: 'IN' },
          { uid: 'DEMO3', displayName: $localize`John Doe`, photoURL: './../../assets/demo-person3.jpg', status: 'IN' },
        ]
        break;
      case '2':
        this.eventTitle = $localize`Volleyball league`;
        this.description = $localize`Game vs Scorchers`
        this.eventDate = new Date(now.setDate(now.getDate() + 1));
        this.eventDate.setHours(19);
        this.eventDate.setMinutes(0);
        this.location = $localize`Loftus Recreation Centre`;
        this.mapsUrl = 'https://goo.gl/maps/h1J5CvH1Si2ZhNsa9';
        this.isStripePrice = true;
        break;
      case '3':
        this.eventTitle = $localize`Doubles Tennis`;
        this.eventDate = new Date(now.setDate(now.getDate() + 1));
        this.eventDate.setHours(10);
        this.eventDate.setMinutes(0);
        this.location = $localize`Wembley Downs Tennis Club`;
        this.mapsUrl = 'https://goo.gl/maps/Yps22dpuubvjsdPN7';
        this.participants = [
          { uid: 'DEMO1', displayName: $localize`Anna Webber`, photoURL: './../../assets/demo-person1.jpg', status: 'IN' },
          { uid: 'DEMO3', displayName: $localize`John Doe`, photoURL: './../../assets/demo-person3.jpg', status: 'IN' },
        ];
        this.isLimitedAttendees = true;
        this.maxAttendees = 2;
        break;
      case '4':
        this.eventTitle = $localize`Football game`;
        this.description = $localize`Social drop-in game`;
        this.eventDate = new Date(now.setDate(now.getDate() - 2));
        this.eventDate.setHours(18);
        this.eventDate.setMinutes(30);
        this.location = $localize`Yokine Regional Open Space`;
        this.mapsUrl = 'https://goo.gl/maps/9veeApFWK2H7sXGY9';
        break;
      default:
        console.error('Event ID is falsy');
        return;
    }
  }

  createStripeConnectedAccount() {
    logEvent(this.analytics, 'create_stripe_account', { uid: 'demo', eventId: 'new demo event' })
    const createAccount = httpsCallableData<unknown, StripeAccountLink>(this.functions, 'createStripeConnectedAccount');
    const createAccountData = {
      isTestMode: true,
      accountType: 'standard',
      email: 'demo@teambldr.web.app',
      businessProfileUrl: `https://team-bldr.web.app/profile/demo`,
      refreshUrl: window.location.href,
      returnUrl: `${window.location.origin}/demo-event/new`
    }
    createAccount(createAccountData).subscribe((accountLink: StripeAccountLink) => {
      window.open(accountLink.url, '_self', '')
    })
  }

  createStripeCheckoutSession() {
    this.isPriceLoading = true;
    const stripeCheckout = httpsCallableData<unknown, Stripe.Checkout.Session>(this.functions, 'createStripeCheckoutSession');

    const returnUrl = `${window.location.origin}/demo-event/2`
    const checkoutData = {
      isTestMode: true,
      payment: {
        mode: 'payment',
        line_items: [{ price: 'price_1NQSmJCj9S5aVtj6ZXBOTanh', quantity: 1 }],
        payment_intent_data: {
          application_fee_amount: 50,
        },
        success_url: returnUrl + '?isPaid=true',
        cancel_url: returnUrl,
      },
      connectedAccountId: 'acct_1Mu6G3Cj9S5aVtj6'
    }
    stripeCheckout(checkoutData).subscribe(r => {
      this.isPriceLoading = false;
      if (r.url) {
        window.open(r.url, '_blank', '')
      } else {
        const message = "No URL returned by createStripeCheckoutSession"
        console.error(message)
        console.log(r);
        this.snackBar.open(message, 'OK');
        this.router.navigate([`/`]);
      }
    })
  }

  setStatus(newStatus: 'IN' | 'OUT'): void {
    //HACK: this is a hack to force the change detection to run to update EventParticipantsComponent
    switch (this.eventId) {
      case '1':
        this.participants = [
          { uid: 'DEMO1', displayName: $localize`Anna Webber`, photoURL: './../../assets/demo-person1.jpg', status: 'IN' },
          { uid: 'DEMO2', displayName: $localize`Jack`, photoURL: './../../assets/demo-person2.jpg', status: 'IN' },
          { uid: 'DEMO3', displayName: $localize`John Doe`, photoURL: './../../assets/demo-person3.jpg', status: 'IN' },
        ]
        break;
      case '3':
        this.participants = [
          { uid: 'DEMO1', displayName: $localize`Anna Webber`, photoURL: './../../assets/demo-person1.jpg', status: 'IN' },
          { uid: 'DEMO3', displayName: $localize`John Doe`, photoURL: './../../assets/demo-person3.jpg', status: 'IN' },
        ];
        break;
      default:
        this.participants = [];
    }

    this.refusals = [];
    this.waitlist = [];
    this.participant.status = newStatus;
    if (newStatus === 'IN') {
      this.participants.push(this.participant);
    } else {
      this.refusals.push(this.participant);
    }
  }

  numberOfAttendees(): string {
    var attendeesInfo = this.participants.length.toString();
    if (this.isLimitedAttendees) {
      attendeesInfo += `/${this.maxAttendees}`;
    }
    return attendeesInfo;
  }

  joinWaitlist(): void {
    this.participant.status = 'WAITLIST';
    this.waitlist = [this.participant];
    this.refusals = [];
  }

  deleteEvent(): void {
    logEvent(this.analytics, 'demo_delete_event', { uid: 'demo', eventId: 'new demo event' })
  }
  duplicateEvent(): void {
    logEvent(this.analytics, 'demo_duplicate_event', { uid: 'demo', eventId: 'new demo event' })
  }

  eventDateTime(): string {
    return this.eventDate.toLocaleString(`en-AU`, {
      dateStyle: "full",
      timeStyle: "short"
    });
  }

  copyEventInvite() {
    var eventUrl = window.location.href;
    const dateTimeOn = this.eventDateTime();

    this.clipboard.copy(`DEMO ${this.eventTitle}\n${dateTimeOn}\nhttps://team-bldr.web.app`);

    if (navigator.share) {
      navigator.share({
        text: `${this.eventTitle}\n${dateTimeOn}`,
        url: eventUrl
      })
    }
  }

}
