import { User } from "@angular/fire/auth";

export interface TeamUser extends User {
    uid: string;
    isTester?: boolean;
    stripeAccountId?: string;
    isStripeAccountEnabled: boolean;
}
