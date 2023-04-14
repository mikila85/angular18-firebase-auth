import { Component, OnInit, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { TeamEvent } from '../models/team-event.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  isLoading = true;
  private auth: Auth = inject(Auth);
  user: User | null = null;
  teamEvents: TeamEvent[] = [];

  async ngOnInit(): Promise<void> {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        const q = query(collection(this.firestore, `users/${this.user.uid}/events`), orderBy('dateTime', 'desc'));
        onSnapshot(q, (querySnapshot) => {
          this.teamEvents = [];
          querySnapshot.forEach((doc) => {
            this.teamEvents.push(doc.data() as TeamEvent);
            this.isLoading = false;
          });
        });
      } else {
        console.error('User object is NULL - user not logged in.');
        this.isLoading = false;
        return;
      }
    });
  }

  teamEventDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }
}
