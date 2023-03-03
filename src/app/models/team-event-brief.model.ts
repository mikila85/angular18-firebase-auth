export interface TeamEventBrief {
    id?: string;
    // URL for src of the icon for the event used in nav list
    icon: string | null;
    title: string;
    dateTime: firebase.default.firestore.Timestamp | Date;
}