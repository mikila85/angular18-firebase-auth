import { TeamEventBrief } from "./team-event-brief.model";

export interface TeamEvent extends TeamEventBrief {
    owner: string;
    description: string;
    isLimitedAttendees: boolean;
    maxAttendees?: number;
    isTeamAllocations: boolean;
    isTestMode?: boolean;
    isReadOnly?: boolean;
    isEventFee: boolean;
    isPaymentRequired?: boolean;
    eventFee?: number;
    applicationFee?: number;
    stripeAccountId?: string;
    stripePriceId?: string;
    stripePriceUnitAmount?: number;
}