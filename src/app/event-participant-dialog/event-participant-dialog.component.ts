import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TeamUserBrief } from '../models/team-user-brief';

@Component({
  selector: 'app-event-participant-dialog',
  templateUrl: './event-participant-dialog.component.html',
  styleUrls: ['./event-participant-dialog.component.css']
})
export class EventParticipantDialogComponent {
  teamColors = ['Red', 'White', 'Blue', 'Orange', 'Yellow', 'Green', 'Gray', 'Purple', 'Cyan', 'PapayaWhip'];

  constructor(
    public dialogRef: MatDialogRef<EventParticipantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public attendee: TeamUserBrief,
  ) { }

  delete(): void {
    this.dialogRef.close({ isDelete: true });
  }

  close(): void {
    this.dialogRef.close();
  }
}
