'use strict'

const request = require('request-promise')
const validation = require('./validation.js')
const account = require('./account.js')
const db = require('./db.js')
const stripeCustomer = require('./stripeCustomer.js')
const utls = require('./utls.js')
const log = utls.logs('facebook')

const graphUrl = 'https://graph.facebook.com'
const facebookPermissions = 'email, first_name, last_name, picture.type(large)'

class Facebook {
  normalizeUser (facebookUser) {
    log.info(`Normalizing facebook user with id: ${facebookUser.id}`)
    return {
      email: facebookUser.email,
      firstname: facebookUser.first_name,
      lastname: facebookUser.last_name,
      imageUrl: facebookUser.picture.data.url,
      facebook_id: facebookUser.id
    }
  }

  createUser (facebookToken) {
        // check db for user
    const url = `${graphUrl}/me`

    console.log(`Trying to get facebook user with access token`)
    // try to get facebook info
    return request.get({
      uri: url,
      qs: {
        access_token: facebookToken,
        fields: facebookPermissions
      },
      json: true
    })
    .then(facebookUser => {
      log.info(`Returned facebook user with id ${facebookUser.id}`)
      log.info(facebookUser)
      return this.normalizeUser(facebookUser)
    })
    .then(facebookUser => {
      // check the results
      if (!validation.user(facebookUser)) {
        throw Error('User could not be validated')
      }

      return db.get(process.env.ACCOUNTS_TABLE, facebookUser.email)
      .then(user => {
        // if the user exists then return
        if (user) {
          log.info(`User already exists on the system: ${user.email}`)
          // return a refreshed user image because facebook sucks
          user.imageUrl = facebookUser.imageUrl
          return user
        }

        log.info(`Creating a stripe account for the user: ${user.email}`)
        // create the stripe customer for the new user
        return stripeCustomer.createCustomer(facebookUser.email)
        .then(customer => {
          // if the response does not have a valid customer id
          if (!customer.id) {
            throw Error('Could not create stripe customer')
          }

          // add the stripe id to the user object
          facebookUser.stripe_id = customer.id

          // create a new account on the system
          return account.barcode(facebookUser)
        })
        .then(completeUser => {
          log.info(`Sending facebook user to be created in the database ${completeUser.id}`)
          return db.put(process.env.ACCOUNTS_TABLE, completeUser)
          .then(() => {
            // return the full user after a successful creation
            return completeUser
          })
        })
      })
    })
  }
}

module.exports = new Facebook()
