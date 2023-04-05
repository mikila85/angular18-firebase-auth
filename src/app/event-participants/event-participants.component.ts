import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant.model';

@Component({
  selector: 'app-event-participants',
  templateUrl: './event-participants.component.html',
  styleUrls: ['./event-participants.component.css']
})
export class EventParticipantsComponent {
  @Input() eventId: string | null = null;
  @Output() numberOfParticipantsEvent = new EventEmitter<number>();
  user: firebase.default.User | null = null;
  private participantsCollection: AngularFirestoreCollection<Participant> | undefined;
  participants: Observable<Participant[]> | undefined;
  isLoading = true;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
  ) { }

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    this.participantsCollection = this.afs.collection<Participant>(`/events/${this.eventId}/participants`);
    this.participants = this.participantsCollection.valueChanges();
    this.participants.subscribe((p) => {
      this.isLoading = false;
      this.numberOfParticipantsEvent.emit(p.length)
    })
  }
}
