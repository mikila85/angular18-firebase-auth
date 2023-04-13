import { Component, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  user: any;
  isLoading: boolean = true;
  userRef: DocumentReference<DocumentData> | undefined = undefined;

  constructor() {
    this.user$.subscribe((user) => {
      this.userRef = doc(this.firestore, `users/${user?.uid}`);
      getDoc(this.userRef).then((user) => {
        this.user = user.data();
        this.isLoading = false;
      });
    });
  }

  updateUser(partialUser: any) {
    if (this.userRef) {
      updateDoc(this.userRef, partialUser);
    }
  }
}
