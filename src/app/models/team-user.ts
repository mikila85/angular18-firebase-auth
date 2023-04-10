export interface TeamUser extends firebase.default.User {
    uid: string;
    isTester?: boolean;
    stripeAccountId?: string;
    isStripeAccountEnabled: boolean;
}
