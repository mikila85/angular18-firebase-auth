import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { TeamEvent } from '../models/team-event.model';
import { TeamBuilderUser } from '../models/teamBuilderUser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isLoading = true;
  user: TeamBuilderUser | undefined;
  private teamEventsCollection: AngularFirestoreCollection<TeamEvent> | undefined;
  teamEvents: TeamEvent[] | undefined;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.afs.collection<TeamEvent>(`events`, ref => ref.orderBy('dateTime', 'asc'))
      .valueChanges({ idField: 'id' })
      .subscribe(events => this.teamEvents = events);
  }

  teamEventDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }
}
