'use strict'

const uuidV4 = require('uuid/v4')

const authentication = require('./authentication.js')
const db = require('./db.js')
const stripeCustomer = require('./stripeCustomer.js')
const stats = require('./stats.js')
const utls = require('./utls.js')

class Account {
  barcode (user) {
        // add created date to user object
    user.created = new Date()
            .getTime()
        // generate a UUID and auth token
    user.id = uuidV4()
        // create an auth token for the user object
    user.token = authentication.token(user)
    return user
  }

  create (user) {
    console.log(`Checking database for the user ${user.email}`)
    stats.counter(`${utls.stage()}.account.create.try`, [1], ['account', 'create'])
    return db
            .get(process.env.ACCOUNTS_TABLE, user.email)
            .then(response => {
                // if the user already exists then throw the user to
                // pop out of the promise chain early
              if (response) {
                console.log(`User already exists in the database with email: ${response.email}`)
                throw new Error(response)
              }

                // create the stripe customer for the new user
              return stripeCustomer.createCustomer(user.email)
                        .then(customer => {
                            // if the response does not have a valid customer id
                          if (!customer.id) {
                            throw new Error('Could not create stripe customer')
                          }
                            // add the stripe id to the user object
                          user.stripe_id = customer.id
                          return user
                        })
            })
            .then(completeUser => {
                // Insert the user into the database
              return authentication.createHash(completeUser.password)
                    .then(hash => {
                        // add the hash to the user object
                      completeUser.hash = hash
                        // delete the password key
                      delete completeUser.password

                      // barcode this user with an id mahhahahahha
                      completeUser = this.barcode(completeUser)

                      // put the objeect into the database
                      stats.counter(`${utls.stage()}.account.create.complete`, [1], ['account', 'create'])
                      return db
                            .put(process.env.ACCOUNTS_TABLE, completeUser)
                            .then(() => {
                                // return the full user after a successful creation
                              return completeUser
                            })
                    })
            })
  }
}

module.exports = new Account()
