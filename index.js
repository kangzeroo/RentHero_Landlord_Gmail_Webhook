const get_staff_by_email = require('./Postgres/Queries/UserQueries').get_staff_by_email
const grab_access_token = require('./auth/google_token_manager').grab_access_token
const getEmailsSinceHistoryID = require('./api/gmail_api').getEmailsSinceHistoryID
const grabAndGroupEmails = require('./api/gmail_api').grabAndGroupEmails
const process_email = require('./api/gmail_webhook/email_processing').process_email

exports.incoming_email = function(req, res) {
  const p = new Promise((res, rej) => {
    // const gmail_payload = Buffer.from(req.data.data, 'base64').toString('ascii')
    const gmail_payload = {"emailAddress":"huang.khan74@gmail.com","historyId":459507}
    console.log(gmail_payload)
    let token = ''
    let emails = []
    let corporation_id = ''
    let user_id = ''
    get_staff_by_email(gmail_payload.emailAddress)
      .then((data) => {
        console.log('===================')
        console.log(data)
        user_id = data.staff_id
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
          return process_email(email[0].email, corporation_id, user_id)
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
