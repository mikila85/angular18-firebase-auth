import { Timestamp } from "@angular/fire/firestore";

export interface Message {
    id?: string;
    userId: string;
    photoURL: string | null;
    displayName: string | null;
    text: string;
    ts: Timestamp | Date;
}
