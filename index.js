const get_staff_by_email = require('./Postgres/Queries/UserQueries').get_staff_by_email
const grab_access_token = require('./auth/google_token_manager').grab_access_token
const getEmailsSinceHistoryID = require('./api/gmail_api').getEmailsSinceHistoryID
const grabAndGroupEmails = require('./api/gmail_api').grabAndGroupEmails
const determineIfNewContactOrOld = require('./Postgres/Queries/UserQueries').determineIfNewContactOrOld
const createNewLead = require('./Postgres/Queries/UserQueries').createNewLead
const getTwilioChannelId = require('./Postgres/Queries/ChatQueries').getTwilioChannelId
const associate_channel_id = require('./Postgres/Queries/ChatQueries').associate_channel_id
const create_channel = require('./routes/channel_routes').create_channel

exports.incoming_email = function(req, res) {
  const p = new Promise((res, rej) => {
    // const gmail_payload = Buffer.from(req.data.data, 'base64').toString('ascii')
    const gmail_payload = {"emailAddress":"huang.khan74@gmail.com","historyId":459507}
    console.log(gmail_payload)
    let token = ''
    let emails = []
    let corporation_id = ''
    // filter messages for only relevant ones
    get_staff_by_email(gmail_payload.emailAddress)
      .then((data) => {
        console.log('===================')
        console.log(data)
        return grab_access_token(data.staff_id)
      })
      .then((data) => {
        console.log(data)
        const { access_token, history_id } = data
        token = access_token
        corporation_id = 'MOCK_CORPORATION_ID'
        return getEmailsSinceHistoryID(token, history_id)
      })
      .then((emailChanges) => {
        if (emailChanges) {
          return grabAndGroupEmails(emailChanges, token, corporation_id)
        } else {
          return Promise.resolve([])
        }
      })
      .then((diffs) => {
        const x = diffs.map((email) => {
          return determineIfNewContactOrOld(email)
                    .then((contactObj) => {
                      // { contact_id: 'xxx' } if exists
                      // {} if not exists
                      console.log('----------- determineIfNewContactOrOld -----------')
                      console.log(contactObj)
                      if (contactObj.contact_id) {
                        return getTwilioChannelId(contactObj.contact_id, corporation_id)
                          .then((data) => {
                            // returns obj { channel_id, } if exists, {} if not exists
                            console.log('----------- getTwilioChannelId -----------')
                            console.log(data)
                            if (data.channel_id) {
                              return associate_channel_id(data.channel_id, corporation_id, contactObj.contact_id)
                            } else {
                              return create_channel(corporation_id, email, contactObj.contact_id)
                                      .then((channelData) => {
                                        return associate_channel_id(channelData.channelSid, email, contactObj.contact_id)
                                      })
                                      .catch((err) => {
                                        return Promise.reject(err)
                                      })
                            }
                          })
                      } else {
                        return createNewLead(email)
                                  .then((contact) => {
                                    console.log(contact)
                                    return Promise.resolve(contact)
                                  })
                                  .catch((err) => {
                                    return Promise.reject(err)
                                  })
                      }
                    })
                    .then((data) => {
                      console.log('----------- processEmail -----------')
                      console.log(data)
                      // return saveToS3AndDynamo()
                    })
                    .then((data) => {
                      console.log('----------- processEmail done -----------')
                      console.log(data)
                      // return saveToS3AndDynamo()
                    })
                    .catch((err) => {
                      return Promise.reject(err)
                    })
        })
        return Promise.all(x)
      })
      .then((diffs) => {
        res(diffs)
      })
      // .then((data) => {
      //   // res.status(200).send({
      //   //   message: 'success'
      //   // })
      // })
      .catch((err) => {
        console.log(err)
        res(err)
        // res.status(500).send({
        //   message: 'failure'
        // })
      })
  })
  return p
}
