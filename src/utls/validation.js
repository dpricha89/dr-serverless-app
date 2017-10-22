'use strict'

const validator = require('validator')

class Validation {
  user (userObj) {
    return (
      userObj.email &&
      userObj.firstname &&
      userObj.lastname &&
      validator.isEmail(userObj.email)
    )
  }

  trip (tripObj) {
    return (
      tripObj.account_id &&
      tripObj.experience_id &&
      tripObj.price &&
      tripObj.stripe_response &&
      tripObj.date
    )
  }

  review (reviewObj) {
    return (
      reviewObj.id &&
      reviewObj.review_id &&
      reviewObj.image_url &&
      reviewObj.name &&
      reviewObj.date &&
      reviewObj.comment
    )
  }

  experience (experienceObj) {
    return (
      experienceObj.description &&
      experienceObj.destination_id &&
      experienceObj.details &&
      experienceObj.highlight_text &&
      experienceObj.highlights &&
      experienceObj.host &&
      experienceObj.id &&
      experienceObj.images &&
      experienceObj.included &&
      experienceObj.itinerary &&
      experienceObj.location &&
      experienceObj.title &&
      experienceObj.price
    )
  }

  host (hostObj) {
    return (
      hostObj.stripe_user_id &&
      hostObj.stripe_publishable_key &&
      hostObj.token_type &&
      hostObj.refresh_token &&
      hostObj.livemode &&
      hostObj.access_token &&
      hostObj.scope
    )
  }
}

module.exports = new Validation()
