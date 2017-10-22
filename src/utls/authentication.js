'use strict'

// Third party
const jwt = require('jsonwebtoken')
const Promise = require('bluebird')
const hashsalt = require('password-hash-and-salt')

// Internal Libs
const db = require('./db.js')
const AuthPolicy = require('../lib/awsPolicy')
const Helpers = require('./helpers')

class Authentication {
  constructor () {
    const helpers = new Helpers()
    this.logger = helpers.logs(this.constructor.name)
  }

  check (email, plaintextPassword) {
        // get the user from the database
    return db.get(process.env.ACCOUNTS_TABLE, email)
            .then(user => {
                // compare hash with the password given
              return new Promise((resolve, reject) => {
                    // check the password against the hash in the db
                hashsalt(plaintextPassword)
                        .verifyAgainst(user.hash, function (err, verified) {
                            // return an error if a there was an error or
                            // if verified is false
                          if (err || !verified) {
                            return reject(err)
                          }
                            // return the users auth token
                          return resolve(user)
                        })
              })
            })
  }

  resetPassword (email, currentPassword, newPassword) {
    return this.check(email, currentPassword)
    .then(() => {
      return this.createHash(newPassword)
    })
    .then(hash => {
      return db.update(process.env.ACCOUNTS_TABLE, email, {hash: hash})
    })
  }

  createHash (plaintextPassword) {
        // hash and salt the password
    return new Promise((resolve, reject) => {
      hashsalt(plaintextPassword)
                .hash(function (err, hash) {
                    // if there was an error then return rejection
                  if (err) {
                    this.logger.error(err)
                    return reject(err)
                  }
                    // return the hashed and salted password
                  return resolve(hash)
                })
    })
  }

  verify (event, secret) {
    // wrap in a promise please
    return new Promise((resolve, reject) => {
      jwt.verify(event.authorizationToken, secret, (err, decoded) => {
        if (err) {
          return reject(err)
        }
        var principalId = decoded.email

        // build apiOptions for the AuthPolicy
        var apiOptions = {}
        var tmp = event.methodArn.split(':')
        var apiGatewayArnTmp = tmp[5].split('/')
        var awsAccountId = tmp[4]
        apiOptions.region = tmp[3]
        apiOptions.restApiId = apiGatewayArnTmp[0]
        apiOptions.stage = apiGatewayArnTmp[1]

        // build the policy
        var policy = new AuthPolicy(principalId, awsAccountId, apiOptions)
        policy.allowAllMethods()
        var authResponse = policy.build()

        // add the jwt to the context
        authResponse.context = decoded

                // return the cool stuff
        return resolve(authResponse)
      })
    })
  }

  token (user) {
    return jwt.sign(user, process.env.JWT_SECRET || 'TEST_SECRET')
  }
}

module.exports = Authentication
