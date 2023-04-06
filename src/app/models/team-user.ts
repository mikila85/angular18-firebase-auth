export interface TeamUser extends firebase.default.User {
    stripeAccountId?: string;
    isStripeAccountEnabled: boolean;
}
