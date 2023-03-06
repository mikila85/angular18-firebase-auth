import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { TeamEventBrief } from '../models/team-event-brief.model';
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

      const eventChanges = this.afs.collection<TeamEvent>(`users/${user.uid}/events`, ref => ref.orderBy('dateTime', 'asc'))
        .valueChanges({ idField: 'id' });
      eventChanges.subscribe(events => {
        this.teamEvents = events;
        this.isLoading = false;
      });
      eventChanges.pipe(take(1)).subscribe(events => { this.refreshEvents(events) });
    })
  }

  teamEventDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }

  /**
   * Goes over the list of events from the user's collection
   * and updates the info with corresponding actual data from events collection.
   * This is a temporary fix to resolve de-normalized data going out of sync.
   * Should be fixed and removed after implementing event sourcing.
   */
  refreshEvents(userEvents: TeamEvent[]) {
    userEvents.forEach(userEvent => {
      this.afs.doc<TeamEvent>(`events/${userEvent.id}`).get().subscribe(event => {
        const eventData = event.data();
        if (!eventData) {
          console.error('refreshEvents: eventData object is falsy');
          return
        }
        if (eventData.title && (<firebase.default.firestore.Timestamp>eventData.dateTime).toMillis() > Date.now()) {
          this.afs.doc<TeamEventBrief>(`users/${this.user?.uid}/events/${userEvent.id}`).update({
            dateTime: eventData.dateTime,
            icon: eventData.icon,
            title: eventData.title
          })
        }
      });
    });
  }
}
