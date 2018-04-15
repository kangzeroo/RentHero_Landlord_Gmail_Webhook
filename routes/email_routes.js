const axios = require('axios')
const MailComposer = require('nodemailer/lib/mail-composer')
const nodemailer = require('nodemailer')
const simpleParser = require('mailparser').simpleParser
const grab_access_token = require('../auth/google_token_manager').grab_access_token
const getReleventThreads = require('../api/email_api').getReleventThreads
const getEmailIDsFromThread = require('../api/email_api').getEmailIDsFromThread
const getBatchEmailsForThreads = require('../api/email_api').getBatchEmailsForThreads
const saveEmails = require('../api/email_api').saveEmails
const replyAppropriatelyToEmail = require('../api/gmail_api').replyAppropriatelyToEmail
const summarizeEmailThread = require('../api/email_api').summarizeEmailThread

// POST /save_relevant_past_emails
exports.save_relevant_past_emails = function(req, res, next){
  console.log('save_relevant_past_emails')
  const user_id = req.body.user_id
  console.log(user_id)
  let token = ''
  let emails = []
  let corporation_id = ''
  grab_access_token(user_id)
    .then((data) => {
      console.log(data)
      const { access_token } = data
      token = access_token
      corporation_id = 'MOCK_CORPORATION_ID'
      return getReleventThreads(access_token)
    })
    .then((data) => {
      return getBatchEmailsForThreads(data.data.threads.map(t => t.id), token)
    })
    .then((allThreads) => {
      // console.log(allThreads)
      const x = allThreads.map((thread) => {
        return summarizeEmailThread(thread, corporation_id)
      })
      return Promise.all(x)
    })
    .then((convo_summaries) => {
      console.log('------- convo_summaries --------')
      // console.log(convo_summaries)
      return saveEmails(convo_summaries, user_id)
    })
    .then((data) => {
      res.json(data)
      // const y = convo_summaries.map((convo) => {
      //   return replyAppropriatelyToEmail(convo, token)
      // })
      // return Promise.all(y)
    })
    // .then((results) => {
    //   console.log(results)
    //   res.json(results)
    // })
    .catch((err) => {
      console.log(err.response.data)
      res.json(err)
    })
}

exports.send_test_email = function(req, res, next) {
  let token = ''
  grab_access_token('user_id')
    .then(({ user_email, access_token, refresh_token }) => {
      token = access_token
      const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
              type: 'OAuth2',
              user: user_email,
              accessToken: token
          }
      })
      return transporter.sendMail({
          from: user_email,
          to: 'kangzeroo@gmail.com',
          subject: 'Reply to: Kijiji Ad for Stuff',
          text: 'Hi I saw your stuff and I thought it was great. Still available? Its a Mario',
          auth: {
              user: user_email,
              refreshToken: refresh_token,
              accessToken: token
          }
      })
      //
      // return axios.post(
      //     `https://www.googleapis.com/upload/gmail/v1/users/me/messages/send`,
      //     {
      //       raw: mail
      //     },
      //     {
      //       headers: {
      //         'Authorization': `Bearer ${access_token}`,
      //         'Content-Type': 'message/rfc822'
      //       }
      //     }
      //   )
    })
    .then((data) => {
      console.log('=========== SUCCESS ===========')
      console.log(data)
    })
    .catch((err) => {
      console.log('=========== FAILURE ===========')
      console.log(err)
      console.log(err.response.data.error)
    })
}
