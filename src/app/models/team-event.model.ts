export interface TeamEvent {
    id?: string;
    // URL for src of the icon for the event used in nav list
    icon: string;
    title: string;
    description: string;
    dateTime: firebase.default.firestore.Timestamp | Date;
}