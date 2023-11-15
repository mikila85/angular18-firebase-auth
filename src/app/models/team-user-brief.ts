export interface TeamUserBrief {
    uid: string;
    displayName: string;
    photoURL?: string | null;
    teamColor?: string;
    /// Event ID of the event this user is attending. Only relevant for participants added by organisers.
    eventId?: string;
}