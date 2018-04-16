const axios = require('axios')
const MailComposer = require('nodemailer/lib/mail-composer')
const checkIfThreadAlreadyRepliedTo = require('../Postgres/Queries/UserQueries').checkIfThreadAlreadyRepliedTo
const incomingEmail = require('./gmail_webhook/email_processing').incomingEmail
const summarizeEmail = require('./email_api').summarizeEmail

exports.getEmailsSinceHistoryID = function(access_token, historyId) {
  const p = new Promise((res, rej) => {
    console.log('historyId: ', historyId)
    axios.get(`https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&historyTypes=messageAdded&labelId=UNREAD`, {
    // axios.get(`https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      .then((data) => {
        console.log('--------- getEmailsSinceHistoryID --------')
        console.log(data.data.history)
        res(data.data.history)
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}

exports.grabAndGroupEmails = function(emailChanges, access_token, corporation_id) {
  /*
    emailChanges = [
      {
          "id": "459511",
          "messages": [
              {
                  "id": "162c93ab66ccdb03",
                  "threadId": "162c93ab66ccdb03"
              }
          ],
          "messagesAdded": [
              {
                  "message": {
                      "id": "162c93ab66ccdb03",
                      "threadId": "162c93ab66ccdb03",
                      "labelIds": [
                          "UNREAD",
                          "CATEGORY_PERSONAL",
                          "INBOX"
                      ]
                  }
              }
          ]
      }
    ]
  */
  const p = new Promise((res, rej) => {
    console.log('========= grabAndGroupEmails ==========')
    const eDiffs = organizeEmails(emailChanges)
    /*
      eDiffs = [
        {
          id: '356352',
          email_ids: ['3524lsjflsf4348']
        }
      ]
    */
    const x = eDiffs.map((eDiff) => {
      return batchGetEmails(eDiff, access_token, corporation_id)
    })
    Promise.all(x)
      .then((diffs) => {
        console.log(diffs)
        res(diffs.filter(d => d))
      }).catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}

function organizeEmails(emailChanges) {
  console.log(emailChanges)
  return emailChanges.map((diff) => {
    const email_ids = []
    if (diff.messages && diff.messages.length > 0) {
      diff.messages.forEach((m) => {
        let exists = false
        email_ids.forEach((id) => {
          if (m.id === id) {
            exists = true
          }
        })
        if (!exists) {
          email_ids.push(m.id)
        }
      })
    }
    if (diff.messagesAdded && diff.messagesAdded.length > 0) {
      diff.messagesAdded.forEach((m) => {
        let exists = false
        email_ids.forEach((id) => {
          if (m.message.id === id) {
            exists = true
          }
        })
        if (!exists) {
          email_ids.push(m.message.id)
        }
      })
    }
    const eDiff = {
      id: diff.id,
      email_ids: email_ids
    }
    return eDiff
  })
}

function batchGetEmails(eDiff, access_token, corporation_id) {
  /*
    eDiff = {
      id: '356352',
      email_ids: ['3524lsjflsf4348']
    }
  */
  const p = new Promise((res, rej) => {
    console.log(eDiff)
    const x = eDiff.email_ids.map((id) => {
      let email = null
      return axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${id}`, {
                headers: {
                  'Authorization': `Bearer ${access_token}`
                }
              })
              .then((data) => {
                email = data.data
                return axios.post(
                        `https://www.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                          addLabelIds: [],
                          removeLabelIds: ['UNREAD']
                        },
                        {
                          headers: {
                            'Authorization': `Bearer ${access_token}`
                          }
                        }
                      )
              })
              .then((data) => {
                return summarizeEmail(email, corporation_id)
              })
              .then((summary) => {
                return Promise.resolve({
                  id: eDiff.id,
                  email: summary
                })
              })
              .catch((err) => {
                return Promise.reject(err)
              })
    })
    Promise.all(x)
      .then((diffs) => {
        console.log('------------- diffs ---------------')
        console.log(diffs)
        res(diffs)
      }).catch((err) => {
        console.log('------------- diffs ---------------')
        console.log(err.response.data.error.errors)
        res(null)
      })
  })
  return p
}
