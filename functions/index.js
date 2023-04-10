const functions = require("firebase-functions");
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripeApiTestKey = 'sk_test_51MocYgCxlz3elfmgLtXVZxrEhrmZE3lXUBFMfpcpknrHfmkOJ9vIsJEF9RAiD9xwrCj79wXmSHpJaMMiZsZrYkXm00fvanaNSc';

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started
// https://stripe.com/docs/api?lang=node
exports.createStripeConnectedAccount = functions.region('australia-southeast1')
    .runWith({ secrets: ["STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY"] }).https
    .onCall(async (data, context) => {
        const apiKey = data.isTestMode ? stripeApiTestKey : process.env.STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY;
        const stripe = require('stripe')(apiKey)

        const newAccount = await stripe.accounts.create({
            type: data.accountType,
            email: data.email,
            business_profile: {
                url: data.businessProfileUrl,
                product_description: "Seamlessly collect fees for events to pass them on quickly and accurately, without any hassle."
            },
            settings: {
                payments: {
                    statement_descriptor: "TEAM-BLDR.WEB.APP"
                }
            }
        });
        console.log(newAccount);

        const accountLink = await stripe.accountLinks.create({
            account: newAccount.id,
            refresh_url: data.refreshUrl,
            return_url: data.returnUrl + newAccount.id,
            type: 'account_onboarding',
        });
        console.log(accountLink);

        accountLink.id = newAccount.id;
        return accountLink;
    })

exports.getStripeConnectedAccount = functions.region('australia-southeast1')
    .runWith({ secrets: ["STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY"] }).https
    .onCall(async (data, context) => {
        const apiKey = data.isTestMode ? stripeApiTestKey : process.env.STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY;
        const stripe = require('stripe')(apiKey)
        const account = await stripe.accounts.retrieve(data.id);
        return account;
    })

exports.createStripePrice = functions.region('australia-southeast1')
    .runWith({ secrets: ["STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY"] }).https
    .onCall(async (data, context) => {
        const apiKey = data.isTestMode ? stripeApiTestKey : process.env.STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY;
        const stripeConnected = require('stripe')(apiKey, {
            stripeAccount: data.stripeAccount
        });

        const price = await stripeConnected.prices.create(data.newPrice)
        return price;
    })

exports.createStripeCheckoutSession = functions.region('australia-southeast1')
    .runWith({ secrets: ["STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY"] }).https
    .onCall(async (data, context) => {
        const apiKey = data.isTestMode ? stripeApiTestKey : process.env.STRIPE_LIVE_RESTRICTED_CONNECT_PLATFORM_API_KEY;
        const stripe = require('stripe')(apiKey)
        const session = await stripe.checkout.sessions.create(data.payment, { stripeAccount: data.connectedAccountId });
        return session;
    })

// curl -X DELETE https://api.stripe.com/v1/accounts/acct_1Mp0zDERJM2fKCZr -u sk_test_51MocYgCxlz3elfmgLtXVZxrEhrmZE3lXUBFMfpcpknrHfmkOJ9vIsJEF9RAiD9xwrCj79wXmSHpJaMMiZsZrYkXm00fvanaNSc:

