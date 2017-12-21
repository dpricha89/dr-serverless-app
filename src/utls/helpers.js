'use strict'

const Sumo = require('../lib/sumo.js')

class Helpers {
  successResponse (callback, body, statusCode = 200) {
    const resBody = body || {
      status: 'success'
    }
    callback(null, {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: JSON.stringify(resBody)
    })
  }

  errorResponse (callback, err, statusCode = 500) {
    callback(JSON.stringify(err), {
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
    return new Sumo('APP_NAME',
    'serverless',
    'serverless/' + module,
    this.stage()
    )
  }
}

module.exports = Helpers
