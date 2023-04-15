import { Component, OnInit, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-stripe-account-created',
  templateUrl: './stripe-account-created.component.html',
  styleUrls: ['./stripe-account-created.component.css']
})
export class StripeAccountCreatedComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  // update user doc in firebase with stripe account ID
  // navigate back to Event page 
  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    const accountId = this.route.snapshot.paramMap.get('accountId');
    onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      updateDoc(doc(this.firestore, `users/${user.uid}`), { stripeAccountId: accountId })
        .then(() => { this.router.navigate(['/event', { eventId: eventId }]) });
    })
  }
}
