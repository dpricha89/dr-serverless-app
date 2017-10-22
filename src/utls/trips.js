'use strict'

// third party
const uuidV4 = require('uuid/v4')

// local libs
// const stats = require('./stats.js')
// const utls = require('./utls.js')
// const log = utls.logs('trips')
const validation = require('./validation.js')

class Trips {
  // validate the trip before creating a db object
  validate (trip) {
    if (validation.trip(trip)) {
     // attach UUID
      trip.id = uuidV4()
     // return the finished trip object
      return trip
    }
    throw new Error('Could not validate trip')
  }
}

module.exports = new Trips()
