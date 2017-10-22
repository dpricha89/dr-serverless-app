'use strict'

const TwilioClient = require('twilio')
const client = new TwilioClient(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

class Twilio {
  sendText () {
    return client.messages.create({
      body: 'New trip booked',
      to: '+16363733882'  // Text this number
    })
  }
}

module.exports = new Twilio()
