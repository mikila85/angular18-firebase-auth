import { TeamEventBrief } from "./team-event-brief.model";

export interface TeamEvent extends TeamEventBrief {
    owner: string;
    description: string;
    isLimitedAttendees: boolean;
    maxAttendees?: number;
    isTeamAllocations: boolean;
    isEventFee: boolean;
}