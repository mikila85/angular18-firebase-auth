import { Component, Input } from '@angular/core';
import { Participant } from '../models/participant.model';

@Component({
  selector: 'app-event-participants',
  templateUrl: './event-participants.component.html',
  styleUrls: ['./event-participants.component.css']
})
export class EventParticipantsComponent {
  @Input() participants: Participant[] = [];
  @Input() refusals: Participant[] = [];
}
