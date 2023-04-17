import { Timestamp } from "@angular/fire/firestore/firebase";
import { TeamUserBrief } from "./team-user-brief";

export interface Participant extends TeamUserBrief {
    isPaid?: boolean;
    paidOn?: Timestamp;
    lastReadMessageOn?: Timestamp;
}