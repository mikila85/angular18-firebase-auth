import { Component, Input, inject } from '@angular/core';
import { Participant } from '../models/participant.model';
import { EventParticipantDialogComponent } from '../event-participant-dialog/event-participant-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Firestore, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-event-participants',
  templateUrl: './event-participants.component.html',
  styleUrls: ['./event-participants.component.css']
})
export class EventParticipantsComponent {
  private firestore: Firestore = inject(Firestore);
  sortedParticipants: Participant[][] = [];
  teamColors: string[] = [];
  @Input() isOwner = false;
  @Input() set participants(value: Participant[]) {
    this.updateParticipants(value);
  }
  @Input() refusals: Participant[] = [];

  constructor(public dialog: MatDialog) { }

  updateParticipants(newParticipants: Participant[]): void {
    newParticipants.forEach(p => { if (!p.teamColor) p.teamColor = 'Undecided' });
    // Sort participants array by team color
    newParticipants.sort((a, b) => {
      if (a.teamColor === b.teamColor) {
        return 0;
      } else if (a.teamColor === undefined) {
        a.teamColor = 'Undecided';
        return -1;
      } else if (b.teamColor === undefined) {
        b.teamColor = 'Undecided';
        return 1;
      } else if (a.teamColor < b.teamColor) {
        return -1;
      } else if (a.teamColor > b.teamColor) {
        return 1;
      } else {
        return 0;
      }
    });
    const uniqueColors = new Set<string>();
    newParticipants.forEach(p => uniqueColors.add(p.teamColor ?? 'Undecided'));
    this.teamColors = Array.from(uniqueColors);
    // Group participants by team color
    this.sortedParticipants = this.teamColors.map(color => newParticipants.filter(p => p.teamColor === color));
  }

  getAvatarUrl(participant: Participant): string {
    return participant.photoURL ?? this.nameToAvatar(participant.displayName);
  }

  nameToAvatar(name: string): string {
    return this.generateAvatar(this.getDisplayNameInitials(name) ?? '', 'white', this.stringToColor(name)) ?? '';
  }

  generateAvatar(text: string, foregroundColor = "white", backgroundColor = "black") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    canvas.width = 40;
    canvas.height = 40;

    // Draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.font = "20px Roboto";
    context.fillStyle = foregroundColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const url = canvas.toDataURL("image/png");
    return url;
  }

  stringToColor(name: string) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    var h = hash % 360;
    //return this.hslToHex(h, 30, 80) // 
    return 'hsl(' + h + ', 30%, 45%)';
  }

  getDisplayNameInitials(displayName: string | null): string | null {
    if (!displayName) {
      return null;
    }
    const initialsRegExp: RegExpMatchArray = displayName.match(/\b\w/g) || [''];
    const initials = (
      (initialsRegExp.shift() || "") + (initialsRegExp.pop() || "")
    ).toUpperCase();
    return initials;
  }

  editParticipant(participant: Participant) {
    if (!(this.isOwner && participant.eventId)) {
      // Only allow editing of participants added by organiser
      return;
    }
    const dialogRef = this.dialog.open(EventParticipantDialogComponent, {
      data: participant,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      if (result.isDelete) {
        deleteDoc(doc(this.firestore, 'events', participant.eventId as string, 'participants', participant.uid));
      } else {
        updateDoc(doc(this.firestore, 'events', participant.eventId as string, 'participants', participant.uid),
          {
            displayName: result.displayName,
            status: 'IN',
            teamColor: result.teamColor ?? null,
            actedOn: new Date()
          });
      }
    });
  }
}
