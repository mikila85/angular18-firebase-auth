export interface Message {
    id?: string;
    userId: string;
    photoURL: string | null;
    displayName: string | null;
    text: string;
    ts: firebase.default.firestore.Timestamp | Date;
}
