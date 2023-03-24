const functions = require("firebase-functions");
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_51MocYgCxlz3elfmgLtXVZxrEhrmZE3lXUBFMfpcpknrHfmkOJ9vIsJEF9RAiD9xwrCj79wXmSHpJaMMiZsZrYkXm00fvanaNSc');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = functions.region('australia-southeast1').https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

exports.testMessage = functions.region('australia-southeast1').https.onCall((data, context) => {
    return "Hello from callable function!"
});

// https://stripe.com/docs/api?lang=node
exports.createStripeConnectedAccount = functions.region('australia-southeast1').https.onCall(async (data, context) => {
    const newAccount = await stripe.accounts.create({
        type: 'express',
        email: data.email,
    });
    console.log(newAccount);

    const accountLink = await stripe.accountLinks.create({
        account: newAccount.id,
        refresh_url: 'https://team-bldr.web.app/',
        return_url: 'https://team-bldr.web.app/',
        type: 'account_onboarding',
    });
    console.log(accountLink);

    accountLink.id = newAccount.id;
    return accountLink;
})

exports.getStripeConnectedAccount = functions.region('australia-southeast1').https.onCall(async (data, context) => {
    const account = await stripe.accounts.retrieve(data.id);
    console.log(account);
    return account;
})

// curl -X DELETE https://api.stripe.com/v1/accounts/acct_1Mp0zDERJM2fKCZr -u sk_test_51MocYgCxlz3elfmgLtXVZxrEhrmZE3lXUBFMfpcpknrHfmkOJ9vIsJEF9RAiD9xwrCj79wXmSHpJaMMiZsZrYkXm00fvanaNSc:

