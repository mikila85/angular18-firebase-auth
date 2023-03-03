export interface TeamBuilderUser extends firebase.default.User {
    info: string;
    fcmToken: string;
}
