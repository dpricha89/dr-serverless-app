'use strict'

const Stripe = require('stripe')

const Db = require('./db')
const Helpers = require('./helpers')

class StripeCustomer {
  constructor () {
    const helpers = new Helpers()
    this.logger = helpers.logs(this.constructor.name)
    this.stripe = Stripe(process.env.STRIPE_SECRET_KEY)
    this.db = new Db()
  }

  charge (amount, source, user) {
    return this.stripe.charges.create({
      amount: amount,
      currency: 'usd',
      customer: user.stripe_id,
      source: source,
      description: `${user.email} | ${user.stripe_id} purchased ${amount}`
    })
    .then(res => {
      return res
    })
  }

  subscribe (customerId, source) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{plan: process.env.STRIPE_PLAN_ID}],
      source: source
    })
  }

  getCustomerId (table, email) {
    // get customer id by email
    return this.db.get(table, email)
    .then(user => {
      return user.stripe_id
    })
  }

  getCharges (customerId) {
    return this.stripe.charges.list({
      limit: 15,
      customer: customerId
    })
  }

  getCustomer (customerId) {
    // get a customer by stripe customer id
    this.logger.info(`Getting stripe customer with id: ${customerId}`)
    return this.stripe.customers.retrieve(customerId)
  }

  createCustomer (email) {
    // create a new customer
    this.logger.info(`Creating stripe customer with email: ${email}`)
    return this.stripe.customers.create({
      email: email
    })
  }

  deleteCustomer (customerId) {
    // delete the customer
    this.logger.info(`Deleting stripe customer with customer id: ${customerId}`)
    return this.stripe.customers.del(customerId)
  }

  updateSources (customerId, sources) {
    // Update the payment soruces
    this.logger.info(`Updating stripe sources for customer id: ${customerId}`)
    return this.stripe.customers.createSource(customerId, {
      source: sources
    })
  }

  defaultSources (customerId, defaultSource) {
    // Set the default payment source
    this.logger.info(`Setting stripe default source for id: ${customerId}`)
    return this.stripe.customers.update(customerId, {
      default_source: defaultSource
    })
  }
}

module.exports = StripeCustomer
