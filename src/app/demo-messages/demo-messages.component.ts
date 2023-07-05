import { Component } from '@angular/core';
import { Message } from '../models/message';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-demo-messages',
  templateUrl: './demo-messages.component.html',
  styleUrls: ['./demo-messages.component.css']
})
export class DemoMessagesComponent {
  messages: Message[] = [];
  text: string = "";

  sendMessage() {
    this.messages.push({
      userId: 'demo',
      photoURL: './../../assets/icons/favicon-32x32.png',
      displayName: 'DEMO Person',
      ts: new Date(),
      text: this.text
    })
    this.text = "";
  }

  messageDateTime(dateTime: Date | Timestamp) {
    return <Date>dateTime;
  }

}
