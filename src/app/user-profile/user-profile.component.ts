import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  userRef: DocumentReference<DocumentData> | undefined = undefined;
  user: any;
  isLoading: boolean = true;

  async ngOnInit(): Promise<void> {
    const authUser = await this.auth.currentUser;
    this.userRef = doc(this.firestore, `users/${authUser?.uid}`);
    this.user = (await getDoc(this.userRef)).data();
    this.isLoading = false;
  }

  updateUser(partialUser: any) {
    if (this.userRef) {
      updateDoc(this.userRef, partialUser);
    }
  }
}
