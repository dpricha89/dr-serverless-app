'use strict'

// 3rd party
const uuidV4 = require('uuid/v4')

// local lib
const db = require('./db.js')
const stats = require('./stats.js')
const utls = require('./utls.js')
const log = utls.logs('host')

class Host {
  signup (user, host) {
    log.info(user)
    log.info(host)
    stats.counter(`${utls.stage()}.host.signup.init`, [1], ['host', 'signup'])

    // attach UUID to host obj
    host.id = uuidV4()
    log.info(`Trying to signup user with id: ${host.id}`)

    // put the object into the db
    return db.put(process.env.HOSTS_TABLE, host)
    .then(() => {
      stats.counter(`${utls.stage()}.host.signup.complete`, [1], ['host', 'signup', 'complete'])
      return db.update(process.env.ACCOUNTS_TABLE, user.email, {
        is_host: true,
        host_id: host.stripe_user_id
      })
    })
  }
  get (hostId) {
    return db.getHost(process.env.ACCOUNTS_TABLE, hostId)
  }
}

module.exports = new Host()
