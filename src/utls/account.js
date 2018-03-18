'use strict'

const uuidV4 = require('uuid/v4')

const Db = require('./db.js')
const StripeCustomer = require('./stripeCustomer')
const Helpers = require('./helpers')
const Authentication = require('./authentication')

class Account {
  constructor () {
    const helpers = new Helpers()
    this.logger = helpers.logs(this.constructor.name)
    this.authentication = new Authentication()
    this.db = new Db()
    this.stripeCustomer = new StripeCustomer()
  }

  barcode (user) {
    this.logger.debug(`Barcoding user`)
    // add created date to user object
    user.created = new Date().getTime()
    // generate a UUID and auth token
    user.id = uuidV4()
    // create an auth token for the user object
    user.token = this.authentication.token(user)
    return user
  }

  create (user) {
    this.logger.debug(`Checking database for the user ${user.email}`)
    return this.db
    .get(process.env.ACCOUNTS_TABLE, user.email)
    .then(response => {
      // if the user already exists then throw the user to
      // pop out of the promise chain early
      if (response) {
        this.logger.error(`User already exists in the database with email: ${response.email}`)
        throw new Error(`User already exists in the database with email: ${response.email}`)
      }

      // create the stripe customer for the new user
      return this.stripeCustomer.createCustomer(user.email)
      .then(customer => {
        // if the response does not have a valid customer id
        if (!customer.id) {
          throw new Error('Could not create stripe customer')
        }
        // add the stripe id to the user object
        user.stripe_id = customer.id
        // if stipeToken is passed then try to signup the user for a subscription.
        // make sure the STRIPE_PLAN_ID is set in the environment.
        if (user.stripeToken) {
          return this.stripeCustomer.subscribe(user.stripe_id, user.stripeToken)
          .then(results => {
            // Remove the stripeToken from the user object
            delete user.stripeToken
            return user
          })
        }
        return user
      })
    })
    .then(completeUser => {
        // Insert the user into the database
      return this.authentication.createHash(completeUser.password)
      .then(hash => {
          // add the hash to the user object
        completeUser.hash = hash
          // delete the password key
        delete completeUser.password
        // barcode this user
        completeUser = this.barcode(completeUser)
        // put the objeect into the database
        return this.db
        .put(process.env.ACCOUNTS_TABLE, completeUser)
        .then(() => {
            // return the full user after a successful creation
          return completeUser
        })
      })
    })
  }

  delete (email, stripeCustomerId = false) {
    // If stripe customer is passed then delete that account first
    if (stripeCustomerId) {
      return this.stripeCustomer.delete(stripeCustomerId)
      .then(response => {
        return this.db.delete(process.env.ACCOUNTS_TABLE, email)
      })
    }
    return this.db.delete(process.env.ACCOUNTS_TABLE, email)
  }
}

module.exports = Account
