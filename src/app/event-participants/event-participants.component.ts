import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
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
  private firestore: Firestore = inject(Firestore);
  participants$: Observable<Participant[]> | undefined;
  refusals$: Observable<Participant[]> | undefined;
  numberOfRefusals: number = 0;
  isLoading = true;

  ngOnInit(): void {
    if (this.eventId === null) {
      console.error('Event ID is null');
      return;
    }
    const participantsCollection = collection(this.firestore, 'events', this.eventId, 'participants');
    this.participants$ = collectionData(participantsCollection) as Observable<Participant[]>;
    this.participants$.subscribe((p) => {
      this.isLoading = false;
      this.numberOfParticipantsEvent.emit(p.length)
    })
    const refusalsCollection = collection(this.firestore, 'events', this.eventId, 'refusals');
    this.refusals$ = collectionData(refusalsCollection) as Observable<Participant[]>;
    this.refusals$.subscribe((p) => { this.numberOfRefusals = p.length });
  }
}
