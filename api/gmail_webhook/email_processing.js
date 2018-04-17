const analyzeEmailAndReply = require('./webhook_apis').analyzeEmailAndReply
const sendRentHeroRedirectEmail = require('./webhook_apis').sendRentHeroRedirectEmail
const sendRentHeroRedirectSMS = require('./webhook_apis').sendRentHeroRedirectSMS
const askForEmailToPersonalRedirect = require('./webhook_apis').askForEmailToPersonalRedirect
const analyzeAndReply = require('./nlp').analyzeAndReply
const create_channel = require('../../routes/channel_routes').create_channel
const associate_channel_id = require('../../Postgres/Queries/ChatQueries').associate_channel_id
const getTwilioChannelId = require('../../Postgres/Queries/ChatQueries').getTwilioChannelId
const determineIfNewPersonalContact = require('../../Postgres/Queries/UserQueries').determineIfNewPersonalContact
const createNewLead = require('../../Postgres/Queries/UserQueries').createNewLead
const extract_phone = require('./extraction_api').extract_phone
const extract_email = require('./extraction_api').extract_email
const checkIfWeAskedForTheirPersonalEmailYet = require('./extraction_api').checkIfWeAskedForTheirPersonalEmailYet
const doesThisEmailMentionTheirPersonalEmail = require('./extraction_api').doesThisEmailMentionTheirPersonalEmail
const determineIfRelevantEmail = require('./extraction_api').determineIfRelevantEmail
const generateObjectFromEmail = require('../email_api').generateObjectFromEmail

exports.process_email = function(email, corporation_id, user_id) {
  const p = new Promise((res, rej) => {
    console.log(email)
    console.log('============= incomingEmail ================')
    determineIfRelevantEmail(email, corporation_id)
      .then((assumed_email) => {
        if (assumed_email) {
          console.log('===> assumed_email: ', assumed_email)
          return extract_email(assumed_email)
                .then((extracted_email) => {
                  console.log('====> extracted email: ', extracted_email)
                  return determineIfNewPersonalContact(extracted_email[0], corporation_id)
                })
        } else {
          res('irrelevant email')
        }
      })
      .then((contactObj) => {
        // { contact_id: 'xxx' } if exists
        // { contact_id: null } if not exists
        console.log('----------- determineIfNewPersonalContact -----------')
        console.log(contactObj)
        if (contactObj && contactObj.contact_id) {
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
                              console.log('========= CREATE CHANNEL =========')
                              return generateObjectFromEmail(email)
                                      .then((emailData) => {
                                        return create_channel(corporation_id, emailData, contactObj.contact_id)
                                      })
                                      .then((channelData) => {
                                        console.log(channelData)
                                        channelId = channelData.channelSid
                                        return associate_channel_id(channelData.channelSid, corporation_id, contactObj.contact_id)
                                      })
                                      .catch((err) => {
                                        console.log(err)
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
        } else if (contactObj) {
          console.log('--------- about to extract phone ---------')
          return extract_phone(email.body).then((phoneNums) => {
                      if (phoneNums && phoneNums.length > 0) {
                        console.log('--------- found phones ---------')
                        email.personal_phone = phoneNums[0]
                        // sendRentHeroRedirectSMS(email, '+15195726998', corporation_id)
                        sendRentHeroRedirectSMS(email, email.personal_phone, corporation_id)
                                .then((data) => {
                                  return generateObjectFromEmail(email)
                                })
                                .then((data) => {
                                  // console.log(data)
                                  return createNewLead(data.first_name, data.last_name, data.email, email.personal_phone, corporation_id)
                                })
                                .then((data) => {
                                  console.log(data)
                                  res('sent-redirect-sms')
                                })
                                .catch((err) => {
                                  console.log(err)
                                  rej(err)
                                })
                      } else {
                        console.log('--------- no phone ---------')
                        email.personal_phone = ''
                        console.log('--------- check for personal email ---------')
                        return doesThisEmailMentionTheirPersonalEmail(email.body)
                      }
                    })
                    // .then((askedYet) => {
                    //   return checkIfWeAskedForTheirPersonalEmailYet(email.body)
                    //   if (!askedYet) {
                    //     askForEmailToPersonalRedirect(email, user_id)
                    //       .then((data) => {
                    //         console.log(data)
                    //         res(data)
                    //       })
                    //       .catch((err) => {
                    //         console.log(err)
                    //         rej(err)
                    //       })
                    //   } else {
                    //     return doesThisEmailMentionTheirPersonalEmail(email.body)
                    //   }
                    // })
                    .then((personalEmail) => {
                      if (!personalEmail) {
                        askForEmailToPersonalRedirect(email, user_id)
                                .then((data) => {
                                  console.log(data)
                                  res('asked-for-personal-contact')
                                })
                                .catch((err) => {
                                  console.log(err)
                                  rej(err)
                                })
                      } else {
                        email.personal_email = personalEmail
                        sendRentHeroRedirectEmail(email, user_id, corporation_id)
                          .then((data) => {
                            return generateObjectFromEmail(email)
                          })
                          .then((data) => {
                            console.log(data)
                            return createNewLead(data.first_name, data.last_name, data.email, data.phone, corporation_id)
                          })
                          .then((data) => {
                            res('sent-redirect-email')
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
        } else {
          res('irrelevant email')
        }
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}
