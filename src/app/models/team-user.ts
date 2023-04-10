export interface TeamUser extends firebase.default.User {
    isTester?: boolean;
    stripeAccountId?: string;
    isStripeAccountEnabled: boolean;
}
