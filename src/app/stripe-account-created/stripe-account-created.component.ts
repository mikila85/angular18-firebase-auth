import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stripe-account-created',
  templateUrl: './stripe-account-created.component.html',
  styleUrls: ['./stripe-account-created.component.css']
})
export class StripeAccountCreatedComponent implements OnInit {
  eventId: string | null = null;
  accountId: string | null = null;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  // update user doc in firebase with stripe account ID
  // navigate back to Event page 
  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.accountId = this.route.snapshot.paramMap.get('accountId');
    this.auth.user.subscribe(user => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.afs.doc(`users/${user.uid}`)
        .update({ stripeAccountId: this.accountId })
        .then(() => { this.router.navigate(['/event', { eventId: this.eventId }]) });
    })
  }
}
