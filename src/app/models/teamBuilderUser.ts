import { User } from "@angular/fire/auth";

export interface TeamBuilderUser extends User {
    info: string;
    fcmToken: string;
}
