import { Clipboard } from '@angular/cdk/clipboard';
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
  eventTime: string = (new Date()).toTimeString().substring(0, 5);
  eventTitle: string = "New Event";
  eventDescription: string = "";
  isLoading = true;
  isNewEvent = true;
  isOwner = false;
  isJoined = false;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    private clipboard: Clipboard,
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
        this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
        this.teamEvent = this.teamEventDoc.valueChanges({ idField: 'id' });
        this.afs.doc(`events/${this.eventId}/participants/${this.user.uid}`)
          .get().subscribe(p => {
            this.isJoined = p.exists;
          });
      }
      else {
        console.log('New Event');
        this.isOwner = true;
        const batch = this.afs.firestore.batch();
        this.eventId = this.afs.createId();

        batch.set(this.afs.doc(`events/${this.eventId}`).ref, {
          owner: user.uid,
          dateTime: this.eventDate,
          icon: user.photoURL
        });

        batch.set(this.afs.doc<TeamEventBrief>(`users/${user.uid}/events/${this.eventId}`).ref, {
          dateTime: this.eventDate,
          icon: user.photoURL,
          title: this.eventTitle
        });

        batch.commit().then(() => {
          this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
          this.teamEvent = this.teamEventDoc.valueChanges();
          this.isLoading = false;
        });
      }
      this.teamEvent?.subscribe(te => {
        if (!te) {
          console.error("ngOnInit teamEvent.subscribe: returned falsy team event")
          return
        }
        this.eventDate = (te.dateTime as firebase.default.firestore.Timestamp).toDate();
        this.eventTime = this.eventDate.toLocaleString("en-AU", { hour12: false, timeStyle: "short" });
        this.eventTitle = te.title;
        this.eventDescription = te.description;
        this.isOwner = te.owner === user.uid;
        this.isLoading = false;
      });
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
    if (this.isJoined) {
      const batch = this.afs.firestore.batch();
      batch.delete(this.afs.doc(`events/${this.eventId}/participants/${this.user?.uid}`).ref);
      if (!this.isOwner) {
        batch.delete(this.afs.doc(`users/${this.user?.uid}/events/${this.eventId}`).ref);
      }
      batch.commit();
    } else {
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
    this.isJoined = !this.isJoined;
  }

  copyEventInvite() {
    var eventUrl = window.location.href;
    if (this.isNewEvent) {
      eventUrl += `/${this.eventId}`;
    }
    var message = `${this.eventTitle}\n${this.eventDate.toLocaleString(`en-AU`, {
      dateStyle: "full",
      timeStyle: "short"
    })}\n${eventUrl}`;

    this.clipboard.copy(message);
  }

  duplicateEvent() {
    if (!this.user) {
      console.error("duplicateEvent: user object is falsy");
      return;
    }
    let newEventDate = new Date();
    newEventDate.setHours(this.eventDate.getHours());
    newEventDate.setMinutes(this.eventDate.getMinutes());

    this.afs.collection<TeamEvent>('events').add({
      title: this.eventTitle,
      description: this.eventDescription ? this.eventDescription : "",
      dateTime: newEventDate,
      owner: this.user.uid,
      icon: this.user.photoURL
    }).then(ref => {
      if (!this.user) {
        console.error("duplicateEvent: user object is falsy");
        return;
      }
      this.afs.doc<TeamEventBrief>(`users/${this.user.uid}/events/${ref.id}`).set({
        dateTime: newEventDate,
        icon: this.user.photoURL,
        title: this.eventTitle
      });
      this.router.navigate([`event/${ref.id}`]).then(() => {
        window.location.reload();
      });;
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
