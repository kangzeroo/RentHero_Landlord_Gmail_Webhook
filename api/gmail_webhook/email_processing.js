const analyzeEmailAndReply = require('./webhook_apis').analyzeEmailAndReply
const sendRentHeroRedirectEmail = require('./webhook_apis').sendRentHeroRedirectEmail
const sendRentHeroRedirectSMS = require('./webhook_apis').sendRentHeroRedirectSMS
const askForEmailToPersonalRedirect = require('./webhook_apis').askForEmailToPersonalRedirect
const analyzeAndReply = require('./nlp').analyzeAndReply
const create_new_contact_by_email = require('../../Postgres/Queries/UserQueries').create_new_contact_by_email
const create_channel = require('../../routes/channel_routes').create_channel
const associate_channel_id = require('../../Postgres/Queries/ChatQueries').associate_channel_id
const getTwilioChannelId = require('../../Postgres/Queries/ChatQueries').getTwilioChannelId
const determineIfNewContactOrOld = require('../../Postgres/Queries/UserQueries').determineIfNewContactOrOld
const createNewContact = require('../../Postgres/Queries/UserQueries').createNewContact
const extract_phone = require('./extraction_api').extract_phone
const checkIfWeAskedForTheirPersonalEmailYet = require('./extraction_api').checkIfWeAskedForTheirPersonalEmailYet
const doesThisEmailMentionTheirPersonalEmail = require('./extraction_api').doesThisEmailMentionTheirPersonalEmail
const determineIfRelevantEmail = require('./extraction_api').determineIfRelevantEmail

exports.process_email = function(email, corporation_id) {
  const p = new Promise((res, rej) => {
    console.log(email)
    console.log('============= incomingEmail ================')
    determineIfRelevantEmail(email)
      .then((relevant) => {
        if (relevant) {
          return determineIfNewContactOrOld(email)
        } else {
          res()
        }
      })
      .then((contactObj) => {
        // { contact_id: 'xxx' } if exists
        // {} if not exists
        console.log('----------- determineIfNewContactOrOld -----------')
        console.log(contactObj)
        if (contactObj.contact_id) {
          let channelId = ''
          return getTwilioChannelId(contactObj.contact_id, corporation_id)
                          .then((data) => {
                            // returns obj { channel_id, } if exists, {} if not exists
                            console.log('----------- getTwilioChannelId -----------')
                            console.log(data)
                            if (data.channel_id) {
                              channelId = data.channel_id
                              return associate_channel_id(data.channel_id, corporation_id, contactObj.contact_id)
                            } else {
                              return create_channel(corporation_id, email, contactObj.contact_id)
                                      .then((channelData) => {
                                        channelId = channelData.channelSid
                                        return associate_channel_id(channelData.channelSid, email, contactObj.contact_id)
                                      })
                                      .catch((err) => {
                                        return Promise.reject(err)
                                      })
                            }
                          })
                          .then(() => {
                            email.twilio_channel_id = channelId
                            analyzeAndReply(email)
                                .then((data) => {
                                  console.log(data)
                                  res(data)
                                })
                                .catch((err) => {
                                  console.log(err)
                                  rej(err)
                                })
                          })
                          .catch((err) => {
                            console.log(err)
                            rej(err)
                          })
        } else {
          console.log('--------- about to extract phone ---------')
          return extract_phone(email.body).then((phoneNums) => {
                      if (phoneNums && phoneNums.length > 0) {
                        console.log('--------- found phones ---------')
                        email.personal_phone = phoneNums[0]
                        sendRentHeroRedirectSMS(email)
                                .then((data) => {
                                  console.log(data)
                                  return createNewContact(email)
                                })
                                .then((data) => {
                                  console.log(data)
                                  res(data)
                                })
                                .catch((err) => {
                                  console.log(err)
                                  rej(err)
                                })
                      } else {
                        console.log('--------- no phone ---------')
                        email.personal_phone = ''
                        console.log('--------- check for personal email ---------')
                        return checkIfWeAskedForTheirPersonalEmailYet(email.body)
                      }
                    })
                    .then((askedYet) => {
                      if (!askedYet) {
                        askForEmailToPersonalRedirect(email)
                          .then((data) => {
                            console.log(data)
                            res(data)
                          })
                          .catch((err) => {
                            console.log(err)
                            rej(err)
                          })
                      } else {
                        return doesThisEmailMentionTheirPersonalEmail(email.body)
                      }
                    })
                    .then((personalEmail) => {
                      if (!personalEmail) {
                        askForEmailToPersonalRedirect(email)
                                .then((data) => {
                                  console.log(data)
                                  res(data)
                                })
                                .catch((err) => {
                                  console.log(err)
                                  rej(err)
                                })
                      } else {
                        email.personal_email = personalEmail
                        sendRentHeroRedirectEmail(email)
                          .then((data) => {
                            console.log(data)
                            return createNewContact(email)
                          })
                          .then((data) => {
                            console.log(data)
                            res(data)
                          })
                          .catch((err) => {
                            console.log(err)
                            rej(err)
                          })
                      }
                    })
                    .catch((err) => {
                      console.log('======== AN ERROR OCCURRED ========')
                      console.log(err)
                      rej(err)
                    })
          // return create_new_contact_by_email(email)
          //           .then((contact) => {
          //             // contact: { contact_id, }
          //             console.log(contact)
          //             return Promise.resolve(contact)
          //           })
          //           .catch((err) => {
          //             return Promise.reject(err)
          //           })
        }
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}
