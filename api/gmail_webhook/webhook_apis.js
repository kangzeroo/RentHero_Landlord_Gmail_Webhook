
const nodemailer = require('nodemailer')
const grab_access_token = require('../../auth/google_token_manager').grab_access_token
const config = require('../../src/config')

const Twilio = require('twilio').Twilio;
const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)

exports.analyzeEmailAndReply = function() {

}

exports.askForEmailToPersonalRedirect = function(email, user_id) {
  const p =  new Promise((res, rej) => {
    grab_access_token(user_id)
      .then(({ user_email, access_token, refresh_token }) => {
        const emailer = generateEmailer(user_email, access_token)
        emailer.sendMail({
            from: user_email,
            to: 'kangzeroo@gmail.com',
            subject: 'RENTHERO - ASK FOR EMAIL',
            text: 'We got your inquiry. What is your personal email or phone? I will send you more info',
            auth: {
                user: user_email,
                refreshToken: refresh_token,
                accessToken: access_token
            }
        })
      })
      .then((data) => {
        console.log('=========== SUCCESS ===========')
        console.log(data)
        res(data)
      })
      .catch((err) => {
        console.log('=========== FAILURE ===========')
        console.log(err)
        console.log(err.response.data.error)
        rej(err)
      })
  })
  return p
}

exports.sendRentHeroRedirectEmail = function(email, user_id) {
  const p = new Promise((res, rej) => {
    grab_access_token(user_id)
      .then(({ user_email, access_token, refresh_token }) => {
        const emailer = generateEmailer(user_email, access_token)
        emailer.sendMail({
            from: user_email,
            to: 'kangzeroo@gmail.com',
            subject: 'RENTHERO: TALK TO US',
            text: 'Check out https://renthero.ca',
            auth: {
                user: user_email,
                refreshToken: refresh_token,
                accessToken: access_token
            }
        })
      })
      .then((data) => {
        console.log('=========== SUCCESS ===========')
        console.log(data)
        res(data)
      })
      .catch((err) => {
        console.log('=========== FAILURE ===========')
        console.log(err)
        console.log(err.response.data.error)
        rej(err)
      })
    
  })
  return p
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

function generateEmailer(user_email, access_token) {
  return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          type: 'OAuth2',
          user: user_email,
          accessToken: access_token
      }
  })
}
