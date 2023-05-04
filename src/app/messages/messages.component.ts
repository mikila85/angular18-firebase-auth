import { Component, Input, OnInit, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { CollectionReference, Firestore, Timestamp, addDoc, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Message } from '../models/message';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  @Input() eventId: string | null = null;
  private firestore: Firestore = inject(Firestore);
  private analytics: Analytics = inject(Analytics);
  private auth: Auth = inject(Auth);
  user: User | null = null;
  private messagesCollection: CollectionReference | undefined;
  messages$: Observable<Message[]> | undefined;
  text: string = "";

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
    });
    if (this.eventId === null) {
      console.error("eventId is NULL");
      return;
    }
    this.messagesCollection = collection(this.firestore, 'events', this.eventId, 'messages');
    const q = query(this.messagesCollection, orderBy('ts', 'desc'));
    this.messages$ = collectionData(q) as Observable<Message[]>;
  }

  sendMessage() {
    if (!this.user || !this.messagesCollection) {
      console.error("sendMessage: user or messages collection is falsy");
      return;
    }
    logEvent(this.analytics, 'send_message', { uid: this.user.uid, eventId: this.eventId })
    addDoc(this.messagesCollection, {
      userId: this.user.uid,
      photoURL: this.user.photoURL,
      displayName: this.user.displayName,
      ts: new Date(),
      text: this.text
    })
    this.text = "";
  }

  messageDateTime(dateTime: Date | Timestamp) {
    return (<Timestamp>dateTime)?.toDate();
  }

}
