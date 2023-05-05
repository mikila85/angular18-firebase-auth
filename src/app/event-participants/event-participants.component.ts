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
}
