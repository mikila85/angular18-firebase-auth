import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { TeamEvent } from '../models/team-event.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isLoading = true;
  user: firebase.default.User | null = null;
  private teamEventsCollection: AngularFirestoreCollection<TeamEvent> | undefined;
  teamEvents: TeamEvent[] | undefined;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.user = user;

      this.afs.collection<TeamEvent>(`users/${user.uid}/events`, ref => ref.orderBy('dateTime', 'asc'))
        .valueChanges({ idField: 'id' })
        .subscribe(events => this.teamEvents = events);
    })
  }

  teamEventDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }
}
