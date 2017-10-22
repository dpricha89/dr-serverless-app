'use strict'

const Sumo = require('../lib/sumo.js')

class Helpers {
  successResponse (callback, body) {
    const resBody = body || {
      status: 'success'
    }
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*' // Required for CORS support to work
      },
      body: JSON.stringify(resBody)
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
