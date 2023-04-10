export interface TeamEventBrief {
    id?: string;
    // URL for src of the icon for the event used in nav list
    icon: string | null;
    // Title is empty for new events until defined by owner
    title?: string;
    dateTime: firebase.default.firestore.Timestamp | Date;
}