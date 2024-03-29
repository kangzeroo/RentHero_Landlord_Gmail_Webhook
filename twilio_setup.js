const twilio = require('twilio')
const twilio_creds = require('./credentials/twilio_credentials')

exports.generate_twilio_client = function() {
  return new twilio(twilio_creds.TWILIO_accountSid, twilio_creds.TWILIO_authToken)
}

exports.generate_twiml_client = function() {
  return require('twilio').twiml.MessagingResponse
}
