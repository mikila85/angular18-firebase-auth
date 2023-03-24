export interface StripeAccountLink {
    id: string;
    object: 'account_link',
    created: number,
    expires_at: number,
    url: string
}
