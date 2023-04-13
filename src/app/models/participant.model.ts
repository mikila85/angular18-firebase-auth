import { TeamUserBrief } from "./team-user-brief";

export interface Participant extends TeamUserBrief {
    isPaid?: boolean;
    paidOn?: firebase.default.firestore.Timestamp;
    lastReadMessageOn?: firebase.default.firestore.Timestamp;
}