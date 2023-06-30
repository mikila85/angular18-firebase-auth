import { Timestamp } from "@angular/fire/firestore/firebase";
import { TeamUserBrief } from "./team-user-brief";

export interface Participant extends TeamUserBrief {
    status?: 'IN' | 'OUT' | 'WAITLIST';
    waitlistOn?: Timestamp;
    isPaid?: boolean;
    paidOn?: Timestamp;
    lastReadMessageOn?: Timestamp;
}