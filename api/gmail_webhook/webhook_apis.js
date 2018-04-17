
const nodemailer = require('nodemailer')
const grab_access_token = require('../../auth/google_token_manager').grab_access_token
const config = require('../../src/config')
const createNewContact = require('../../Postgres/Queries/UserQueries').createNewContact
const Twilio = require('twilio').Twilio;
const extract_phone = require('./extraction_api').extract_phone
const extract_email = require('./extraction_api').extract_email
const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)

exports.analyzeEmailAndReply = function() {

}

exports.askForEmailToPersonalRedirect = function(email, user_id) {
  const p =  new Promise((res, rej) => {
    grab_access_token(user_id)
      .then(({ user_email, access_token, refresh_token }) => {
        const emailer = generateEmailer(user_email, access_token)
        return emailer.sendMail({
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
        // return Promise.resolve('success')
      })
      .then((data) => {
        console.log('=========== SUCCESS ===========')
        console.log('askForEmailToPersonalRedirect')
        console.log(data)
        res('asked-for-personal-contact')
      })
      .catch((err) => {
        console.log('=========== FAILURE ===========')
        console.log('askForEmailToPersonalRedirect')
        console.log(err)
        console.log(err.response.data.error)
        rej(err)
      })
  })
  return p
}

exports.sendRentHeroRedirectEmail = function(email, user_id, corporation_id) {
  const p = new Promise((res, rej) => {
    grab_access_token(user_id)
      .then(({ user_email, access_token, refresh_token }) => {
        const emailer = generateEmailer(user_email, access_token)
        return emailer.sendMail({
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
        // return Promise.resolve('success')
      })
      .then((data) => {
        console.log('=========== SUCCESS ===========')
        console.log('sendRentHeroRedirectEmail')
        return createContactObject(email)
      })
      .then((contactObj) => {
        return createNewContact(contactObj, corporation_id)
      })
      .then((data) => {
        res([
          'redirect-email-sent',
          'new contact created'
        ])
      })
      .catch((err) => {
        console.log('=========== FAILURE ===========')
        console.log('sendRentHeroRedirectEmail')
        console.log(err)
        console.log(err.response.data.error)
        rej(err)
      })

  })
  return p
}

// send the RentHero Redirect Email to a phone number
exports.sendRentHeroRedirectSMS = function(email, to, corporation_id) {
  const p = new Promise((res, rej) => {
    console.log(email)
    client.messages.create({
      body: 'Please visit www.renthero.ca',
      to: to,
      from: '+17059996828',
    })
    .then((response) => {
      console.log('======= SUCCESS ========')
      console.log('sendRentHeroRedirectEmail')
      // console.log(response)
      return createContactObject(email)
    })
    .then((contactObj) => {
      return createNewContact(contactObj, corporation_id)
    })
    .then((data) => {
      res([
        'redirect sms sent',
        'new contact created'
      ])
    })
    .catch((err) => {
      console.log('=========== FAILURE ===========')
      console.log('sendRentHeroRedirectEmail')
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


function createContactObject(email) {
  const p = new Promise((res, rej) => {
    // contact = { first_name, last_name, email, phone }
    // console.log(email)
    const from_string = email.headers.filter((head) => {
      return head.name === 'From'
    })[0].value
    // const email_string = from_string.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)[0]
    const name = from_string.slice(0, from_string.indexOf('<') - 1).split(' ')
    const first_name = name[0]
    const last_name = name[1]

    let phone_number
    // let email_address

    extract_phone(email.body)
    .then((phoneNums) => {
      phone_number = phoneNums[0]
      return extract_email(email.body)
    })
    .then((data) => {
      // email_address = data[0]
      const contactObj = {
        first_name: first_name,
        last_name: last_name,
        email: data[0],
        phone: phone_number,
      }
      res(contactObj)
    })
  })
  return p
}
