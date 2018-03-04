'use strict'

const TwilioClient = require('twilio')

class Twilio {
  constuctor () {
    this.client = new TwilioClient(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  }

  sendText () {
    return this.client.messages.create({
      body: 'New trip booked',
      to: '+154634733882'  // Text this number
    })
  }
}

module.exports = Twilio
