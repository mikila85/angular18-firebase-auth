import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamEvent } from '../models/team-event.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isLoading = true;
  user: firebase.default.User | null = null;
  teamEvents: TeamEvent[] | undefined;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
  ) { }

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      if (!user) {
        console.error('User object is falsy');
        this.isLoading = false;
        return;
      }
      this.user = user;

      // Uncomment to show all events
      //const eventChanges = this.afs.collection<TeamEvent>(`events`, ref => ref.orderBy('dateTime', 'desc'))
      const eventChanges = this.afs.collection<TeamEvent>(`users/${user.uid}/events`, ref => ref.orderBy('dateTime', 'desc'))
        .valueChanges({ idField: 'id' });
      eventChanges.subscribe(events => {
        this.teamEvents = events;
        this.isLoading = false;
      });
    })
  }

  teamEventDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }
}
