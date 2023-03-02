export interface TeamEvent {
    id?: string;
    title: string;
    description: string;
    dateTime: firebase.default.firestore.Timestamp | Date;
}