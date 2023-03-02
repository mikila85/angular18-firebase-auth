import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { TeamEvent } from '../models/team-event.model';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  teamEventDoc: AngularFirestoreDocument<TeamEvent> | undefined;
  teamEvent: Observable<TeamEvent | undefined> | undefined;
  eventId: string | undefined;
  minDate: Date = new Date();
  eventDate: Date = new Date();
  eventTime: string = "";

  constructor(
    private afs: AngularFirestore,
    //private fns: AngularFireFunctions,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (eventId) {
      this.eventId = eventId;
    }
    else {
      console.log('New Event');
      this.eventId = this.afs.createId();
      this.afs.collection(`/events`)
        .doc(this.eventId)
        .set({});
    }
    this.teamEventDoc = this.afs.doc<TeamEvent>(`events/${this.eventId}`);
    this.teamEvent = this.teamEventDoc.valueChanges();
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
    console.log(this.eventDate)
    // this.teamEventDoc.update({ dateTime: this.eventDate });
  }

}
