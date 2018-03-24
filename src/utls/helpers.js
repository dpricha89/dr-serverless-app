'use strict'

const Sumo = require('../lib/sumo.js')

class Helpers {
  updateBody (body) {
    if (!body) {
      return '{ "status": "empty"}'
    } else if (typeof body === 'string' || body instanceof String) {
      return `{ "status": "${body}" }`
    } else if (body instanceof Error) {
      return body.toString()
    } else {
      return JSON.stringify(body)
    }
  }

  successResponse (callback, body, statusCode = 200) {
    callback(null, {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: this.updateBody(body)
    })
  }

  errorResponse (callback, err, statusCode = 500) {
    callback(this.updateBody(err), {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      }
    })
  }

  stage () {
    return process.env.STAGE || 'dev'
  }

  logs (module) {
    return new Sumo(process.env.SUMO_APP_NAME || 'APP_NAME',
    'serverless',
    'serverless/' + module,
    this.stage()
    )
  }
}

module.exports = Helpers
