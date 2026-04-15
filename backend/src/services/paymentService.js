const Stripe = require('stripe')
const env = require('../config/env')
const ApiError = require('../utils/apiError')

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null

async function createCheckoutSession(plan, user) {
  if (!stripe) {
    throw new ApiError(400, 'Stripe is not configured yet.')
  }

  const price = plan === 'yearly' ? env.stripePriceYearly : env.stripePriceMonthly
  if (!price) {
    throw new ApiError(400, 'Price id is missing for the selected plan.')
  }

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${env.clientUrl}/#/settings?payment=success`,
    cancel_url: `${env.clientUrl}/#/settings?payment=cancelled`,
    customer_email: user.email,
    line_items: [{ price, quantity: 1 }],
    metadata: {
      userId: user.sub,
      plan,
    },
  })
}

module.exports = {
  createCheckoutSession,
}

