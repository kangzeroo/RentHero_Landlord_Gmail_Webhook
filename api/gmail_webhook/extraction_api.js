const phone_lookup = require('./phone_lookup_api').phone_lookup
const getContactsAndLeadsEmailsForCorporation = require('../../Postgres/Queries/UserQueries').getContactsAndLeadsEmailsForCorporation
const match_corporation_phone = require('../../Postgres/Queries/NumberQueries').match_corporation_phone

exports.extract_email = (text) => {
  const p = new Promise((res, rej) => {
    let emails = text.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
    if (emails) {
      emails = emails.filter((email) => {
        return email.length < 100
      }).filter((email) => {
        return email.toLowerCase().indexOf('.png') === -1 && email.toLowerCase().indexOf('.jpg') === -1 && email.toLowerCase().indexOf('.jpeg') === -1 && email.toLowerCase().indexOf('.svg') === -1
      })
    } else {
      emails = []
    }
    res(emails)
  })
  return p
}

exports.extract_phone = (text) => {
  const p = new Promise((res, rej) => {
    let numbers = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '').match(/[-]{0,1}[\d]*[\.]{0,1}[\d]+/g)

    if (numbers) {
      numbers = numbers.filter((number) => {
        return number.length >= 10 && number.length <= 11
      })
    } else {
      numbers = []
    }
    const arrayOfPromises = numbers.map((number) => {
      return phone_lookup(number)
            .then((data) => {
              console.log(data)
              return Promise.resolve(data)
            })
            .catch((err) => {
              return Promise.resolve('')
            })
    })

    Promise.all(arrayOfPromises)
    .then((data) => {
      const valid_numbers = data.filter(i => i !== '')
      res(valid_numbers)
    })
    .catch((data) => {
      rej(data)
    })
  })
  return p
}

exports.checkIfWeAskedForTheirPersonalEmailYet = function(text) {
  const p = new Promise((res, rej) => {
    console.log('============= checkIfWeAskedForTheirPersonalEmailYet ===============')
    // step 1, we check if we asked for their personal email yet by regexing known phrases we would have said
    // eg. 'what is your email?', 'send me your email'
    const already_asked_regex = text.match(/(what is your email?)|(send your email)/ig)
    if (already_asked_regex) {
      res(true)
    } else {
      res(false)
    }
  })
  return p
}

// duplicate of extraction_api
exports.doesThisEmailMentionTheirPersonalEmail = function(text) {
  const p = new Promise((res, rej) => {
    // step 1, we parse through the email body for any mention of an email address
    const email_regex_results = text.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/ig)
    let filtered_emails = []
    // in step 1, email_regex may inadvertantly mistake image urls as emails (eg. https://us-east-1.amazon-s3.com/bucket/image@2x.png)
    // thus in step 2, we check that there are no images
    // next in step 3, we check that this email is not a predicted email (those we know are not the personal email)
    if (email_regex_results && email_regex_results.length > 0) {
      filtered_emails = email_regex_results.filter((prospect) => {
        return !prospect.match(/(.svg)|(.png)|(.jpeg)|(.jpg)|(.pdf)|(.woff)|(.gif)|(.html)/ig)
      }).filter((prospect) => {
        return !prospect.match(/(kijiji.ca){1}|(kijiji.com){1}|(padmapper.com){1}|(zumper.com){1}|(zlead.co){1}/ig)
      })
    }
    if (filtered_emails && filtered_emails.length > 0) {
      res(filtered_emails[0])
    } else {
      res(false)
    }
  })
  return p
}

exports.determineIfRelevantEmail = function(email, corporation_id) {
  const p = new Promise((res, rej) => {
    // relevant if the email is coming from a known classifieds channel or proxy email domain
    // irrelevant if the email contains a 'noreply@' or 'no-reply@' email in the reply-to or from headers
    console.log('========= determineIfRelevantEmail =========')
    const froms = email.headers.filter((h) => {
      return h.name === 'Reply-To' || h.name === 'From'
    }).map((h) => {
      return h.value
    })

    const summ_froms = froms.join('')
    const assumed_email = froms.filter((sum) => {
                            return sum.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
                          })[0]
    // if (summ_froms.indexOf('noreply') > -1 || summ_froms.indexOf('no-reply') > -1) {
    //   console.log('irrelevant')
    //   res(false)
    // } else if (summ_froms.indexOf('zlead.co') > -1 || summ_froms.indexOf('rts.kijiji.ca') > -1 || summ_froms.indexOf('renthero.ca') > -1) {
    //   console.log('good -- relevant')
    //   res(assumed_email)
    // } else {
      getContactsAndLeadsEmailsForCorporation(corporation_id)
        .then((whitelist) => {
          console.log('====== WHITELIST ======')
          console.log(whitelist)
          let passWhitelist = false
          whitelist.forEach((w) => {
            if (summ_froms.indexOf(w.email) > -1) {
              passWhitelist = true
            }
          })
          if (passWhitelist) {
            console.log('good -- relevant')
            res(assumed_email)
          } else {
            console.log('irrelevant')
            res(false)
          }
        }).catch((err) => {
          console.log('failed-to-get-linked-emails-for-corporation')
          res(false)
        })
    // }
  })
  return p
}
