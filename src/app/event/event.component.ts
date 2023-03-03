import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TeamEventBrief } from '../models/team-event-brief.model';
import { TeamEvent } from '../models/team-event.model';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  user: firebase.default.User | null = null;
  teamEventDoc: AngularFirestoreDocument<TeamEvent> | undefined;
  teamEvent: Observable<TeamEvent | undefined> | undefined;
  eventId: string | null = null;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = (new Date()).toTimeString();
  isNewEvent = true;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    this.auth.user.subscribe(user => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.user = user;

      if (this.eventId) {
        this.isNewEvent = false;
        this.eventId = this.eventId;
        this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
        this.teamEvent = this.teamEventDoc.valueChanges();
      }
      else {
        console.log('New Event');
        const batch = this.afs.firestore.batch();
        this.eventId = this.afs.createId();

        batch.set(this.afs.doc(`events/${this.eventId}`).ref, {
          dateTime: this.eventDate,
          icon: user.photoURL
        });

        batch.set(this.afs.doc<TeamEventBrief>(`users/${this.user?.uid}/events/${this.eventId}`).ref, {
          dateTime: this.eventDate,
          icon: user.photoURL,
          title: "New Event"
        });

        batch.commit().then(() => {
          this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
          this.teamEvent = this.teamEventDoc.valueChanges();
        });
      }
    });
  }

  updateEventDate(date: Date): void {
    this.eventDate = date;
    this.updateEventDateTime();
  }

  updateEventTime(time: string): void {
    this.eventTime = time;
    this.updateEventDateTime();
  }

  updateEventDateTime(): void {
    if (!(this.eventDate && this.eventTime)) return;

    this.eventDate.setHours(Number(this.eventTime.substring(0, 2)));
    this.eventDate.setMinutes(Number(this.eventTime.substring(3, 5)));
    this.teamEventDoc?.update({ dateTime: this.eventDate });
  }

  joinEvent(): void {
    this.teamEvent?.subscribe(teamEvent => {
      if (!teamEvent) {
        console.error("joinEvent: teamEvent is falsy")
        return
      }
      const batch = this.afs.firestore.batch();
      batch.set(this.afs.collection(`events/${this.eventId}/participants`)
        .doc(this.user?.uid).ref, {
        uid: this.user?.uid,
        displayName: this.user?.displayName,
        photoURL: this.user?.photoURL
      });

      batch.set(this.afs.collection<TeamEventBrief>(`users/${this.user?.uid}/events`)
        .doc(this.eventId ? this.eventId : undefined).ref, {
        dateTime: teamEvent.dateTime,
        icon: teamEvent.icon,
        title: teamEvent.title
      });

      batch.commit();
    })
  }

  deleteEvent(): void {
    if (!this.teamEventDoc) {
      console.error("deleteEvent: falsy teamEventDoc");
      return;
    }
    const batch = this.afs.firestore.batch();
    batch.delete(this.teamEventDoc.ref)
    batch.delete(this.afs.doc(`users/${this.user?.uid}/events/${this.eventId}`).ref)
    batch.commit().then(() => { this.router.navigate([`/`]) });
  }
}
