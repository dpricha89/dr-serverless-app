'use strict'

const stripe = require('stripe')('sk_test_EINMwhftuBdW3dTc78In8e0f')

const db = require('./db.js')
const stats = require('./stats.js')
const utls = require('./utls.js')
const log = utls.logs('stripe')

class StripeCustomer {
  charge (amount, source, user) {
    stats.counter(`${utls.stage()}.stripe.charge.init`, [1], ['stripe', 'charge'])
    return stripe.charges.create({
      amount: amount,
      currency: 'usd',
      customer: user.stripe_id,
      source: source,
      description: `${user.email} | ${user.stripe_id} purchased ${amount}`
    })
    .then(res => {
      stats.counter(`${utls.stage()}.stripe.charge.success`, [1], ['stripe', 'charge'])
      return res
    })
  }

  getCustomerId (table, email) {
    // get customer id by email
    return db.get(table, email)
            .then(user => {
              return user.stripe_id
            })
  }

  getCharges (customerId) {
    return stripe.charges.list({
      limit: 15,
      customer: customerId
    })
  }

  getCustomer (customerId) {
    // get a customer by stripe customer id
    log.info(`Getting stripe customer with id: ${customerId}`)
    return stripe.customers.retrieve(customerId)
  }

  createCustomer (email) {
    // create a new customer
    log.info(`Creating stripe customer with email: ${email}`)
    return stripe.customers.create({
      email: email
    })
  }

  deleteCustomer (customerId) {
    // delete the customer
    log.info(`Deleting stripe customer with customer id: ${customerId}`)
    return stripe.customers.del({
      customerId: customerId
    })
  }

  updateSources (customerId, sources) {
    // Update the payment soruces
    log.info(`Updating stripe sources for customer id: ${customerId}`)
    return stripe.customers.createSource(customerId, {
      source: sources
    })
  }

  defaultSources (customerId, defaultSource) {
    // Set the default payment source
    log.info(`Setting stripe default source for id: ${customerId}`)
    return stripe.customers.update(customerId, {
      default_source: defaultSource
    })
  }
}

module.exports = new StripeCustomer()
