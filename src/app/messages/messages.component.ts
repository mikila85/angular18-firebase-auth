import { Component, Input, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Message } from '../models/message';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  @Input() eventId: string | null = null;
  user: firebase.default.User | null = null;
  private messagesCollection: AngularFirestoreCollection<Message> | undefined;
  messages: Observable<Message[]> | undefined;
  text: string = "";

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
  ) { }

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    this.messagesCollection = this.afs.collection<Message>(`events/${this.eventId}/messages`, ref =>
      ref.orderBy('ts', 'desc'));
    this.messages = this.messagesCollection.valueChanges();
  }

  sendMessage() {
    if (!this.user || !this.messagesCollection) {
      console.error("sendMessage: user or messages collection is falsy");
      return;
    }

    this.messagesCollection.add({
      userId: this.user.uid,
      photoURL: this.user.photoURL,
      displayName: this.user.displayName,
      ts: new Date(),
      text: this.text
    });
    this.text = "";
  }

  messageDateTime(dateTime: Date | firebase.default.firestore.Timestamp) {
    return (<firebase.default.firestore.Timestamp>dateTime)?.toDate();
  }

}
