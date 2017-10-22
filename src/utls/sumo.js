'use strict'

const request = require('request-promise')
const _ = require('underscore')

// make sumo a singleton for gateway id tracing
let instance = null
class Sumo {
  constructor (sourceName, hostName, category, stage) {
    // null then set to this
    if (!instance) {
      instance = this
    }
    // api gateway request id that should be tagged in each log.
    // this allows us to do log tracing. example: log comes in to
    // create an account and we want to trace that to the success
    // log at the end of the request
    this.requestId = null
    // create the headers
    const headers = {
      'X-Sumo-Name': sourceName,
      'X-Sumo-Host': hostName,
      'X-Sumo-Category': category
    }
    this.stage = stage
    // create the options
    this.options = {
      headers: headers,
      method: 'POST',
      uri: process.env.SUMO_ENDPOINT || 'localhost',
      json: true
    }

    return instance
  }

  info (log) {
    return this.ship(log, 'INFO')
  }

  error (log) {
    return this.ship(log, 'ERROR')
  }

  warn (log) {
    return this.ship(log, 'WARN')
  }

  logGatewayEvent (event) {
    // get the request context
    let log = _.clone(event.requestContext)
    // remove the PII
    if (log.authorizer) {
      delete log.authorizer
    }
    // save the request id for future logs
    this.requestId = log.requestId
    return this.info(log)
  }

  ship (log, level) {
    if (this.options.uri === 'localhost') {
      console.log(log)
    } else {
      return request(this.wrap(log, level))
      .then()
      .catch(err => {
        console.error(err)
      })
    }
  }

  wrap (log, level) {
    const options = _.clone(this.options)
    options.body = {
      level: level,
      ts: new Date(),
      env: this.stage,
      msg: log
    }
    options.body.requestId = this.requestId
    return options
  }
}

module.exports = Sumo
