'use strict'

// third party
const uuidV4 = require('uuid/v4')

// local libs
const db = require('./db.js')

class Experience {
  // validate the experience before creating a db object
  create (table, experience) {
    // attach UUID
    experience.id = uuidV4()
    // return the finished trip object
    return db.put(table, experience)
  }
}

module.exports = new Experience()
