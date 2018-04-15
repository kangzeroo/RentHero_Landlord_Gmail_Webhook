const analyzeEmailAndReply = require('./webhook_apis').analyzeEmailAndReply
const sendRentHeroRedirectEmail = require('./webhook_apis').sendRentHeroRedirectEmail
const sendRentHeroRedirectSMS = require('./webhook_apis').sendRentHeroRedirectSMS
const askForEmailToPersonalRedirect = require('./webhook_apis').askForEmailToPersonalRedirect
const analyzeAndReply = require('./nlp').analyzeAndReply


exports.process_email = function(email) {
  const p = new Promise((res, rej) => {
  console.log(email.html)
  console.log('============= incomingEmail ================')
  // receives the email webhook event from Gmail
  checkIfKnownPersonalEmail(email)
    .then((known) => {
      console.log('known: ', known)
      if (known) {
        console.log('YES KNOWN')
        return analyzeAndReply(email)
                .then((data) => {
                  console.log(data)
                  res(data)
                })
                .catch((err) => {
                  console.log(err)
                  rej(err)
                })
      } else {
        console.log('NOT KNOWN')
        return checkIfPhoneNumberMentioned(email)
      }
    })
    .then((includesPhoneNumber) => {
      if (includesPhoneNumber) {
        return sendRentHeroRedirectSMS(email)
      } else {
        return checkIfWeAskedForTheirPersonalEmailYet(email)
      }
    })
    .then((askedYet) => {
      if (!askedYet) {
        return askForEmailToPersonalRedirect(email)
      } else {
        return doesThisEmailMentionTheirPersonalEmail(email)
      }
    })
    .then((mentionsActualEmail) => {
      if (!mentionsActualEmail) {
        return askForEmailToPersonalRedirect(email)
      } else {
        return saveEmailToDb(email)
      }
    })
    .then((data) => {
      return sendRentHeroRedirectEmail(email)
    })
    .then((data) => {
      console.log('======== SUCCESSFULLY PROCESSED ========')
      console.log(data)
      res(data)
    })
    .catch((err) => {
      console.log('======== AN ERROR OCCURRED ========')
      console.log(err)
      rej(err)
    })
  })
  return p
}

function saveEmailToDb(email) {

}

function checkIfKnownPersonalEmail(email) {
  // query database of known tenants to see if we recognize the sender
  // do something
  console.log('============== checkIfKnownPersonalEmail ==============')
  return Promise.resolve(false)
}

// duplicate of extraction_api
function checkIfPhoneNumberMentioned(email) {
  console.log('============== checkIfPhoneNumberMentioned ==============')
  // const phone_regex = /(tel://){1}\d{9,10}/ig
  // do something
  return Promise.resolve(false)
}

function checkIfWeAskedForTheirPersonalEmailYet(email) {
  console.log('============= checkIfWeAskedForTheirPersonalEmailYet ===============')
  // step 1, we check if we asked for their personal email yet by regexing known phrases we would have said
  // eg. 'what is your email?', 'send me your email'
  const already_asked_regex = email.html.match(/(what is your email?)|(send your email)/ig)
  console.log(already_asked_regex)
  // step 2, we decide what to do if we did not get their personal email yet
  const did_we_ask = 'true or false'
  // do something
}

// duplicate of extraction_api
function doesThisEmailMentionTheirPersonalEmail(email) {
  // step 1, we parse through the email body for any mention of an email address
  // const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/ig
  // in step 1, email_regex may inadvertantly mistake image urls as emails (eg. https://us-east-1.amazon-s3.com/bucket/image@2x.png)
  // thus in step 2, we check that there are no images
  // const no_images_regex = /(.svg)|(.png)|(.jpeg)|(.jpg)|(.pdf)|(.woff)|(.gif)|(.html)/ig
  // next in step 3, we check that this email is not a predicted email (those we know are not the personal email)
  const known_emails_regex = [
    // { type: 'kijiji', regex: /(kijiji.ca){1}|(kijiji.com){1}/ig },
    // { type: 'padmapper', regex: /(padmapper.com){1}/ig },
    // { type: 'zumper', regex: /(zumper.com){1}/ig },
    // { type: 'zlead', regex: /(zlead.co){1}/ig },
  ]
  const own_proxy_email = 'email.OWN_EMAIL'
  const surviving_emails = email_regex.filter((emails) => {
    return 'filter out the no_images_regex, known_emails_regex and own_proxy_email'
  })
  // finally in step 4, we expect that the surviving_emails will be the lead's personal email
  const personal_email = surviving_emails[0]
  // do something
}
