const config = require('../../src/config')

const Twilio = require('twilio').Twilio;
const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)


// incoming email from a known personal email, read what it says and reply as appropriate
// dont just re-send the renthero redirect
exports.analyzeEmailAndReply = function() {

}

// send the RentHero Redirect Email to a personal email
exports.sendRentHeroRedirectEmail = function() {

}

// send the RentHero Redirect Email to a phone number
exports.sendRentHeroRedirectSMS = function(email) {
  const p = new Promise((res, rej) => {
    console.log(email)
    client.messages.create({
      body: 'Please visit www.renthero.ca',
      to: '+15195726998',
      from: '+17059996828',
    })
    .then((response) => {
      console.log('=======sendRentHeroRedirectSMS RESPONSE========')
      console.log(response)
      res('Success')
    })
    .catch((err) => {
      console.log(err)
      res('Failed')
    })
  })
  return p
}

// ask for personal email to send RentHero Redirect
exports.askForEmailToPersonalRedirect = function() {

}
