const axios = require('axios')
const moment = require('moment')
const simpleParser = require('mailparser').simpleParser
const uploadToS3 = require('./aws_s3').uploadToS3
const bulkInsertEmailSummariesIntoDynamoDB = require('../DynamoDB/aws_dynamodb').bulkInsertEmailSummariesIntoDynamoDB
const createTwilioChannel = require('./gmail_webhook/twilio_api').createTwilioChannel

exports.getReleventThreads = function(access_token) {
  const past5Days = moment().subtract(3, 'days').format('gggg/MM/DD')
  return axios.get(`https://www.googleapis.com/gmail/v1/users/me/threads?q={"PadMapper tenant lead" "Zumper tenant lead" "Ad on Kijiji"}after:${past5Days}`, {
  // return axios.get(`https://www.googleapis.com/gmail/v1/users/me/threads?q=in:Padmapper`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  })
}

exports.getBatchEmailsForThreads = function(threadIds, accessToken) {
  const p = new Promise((res, rej) => {
    console.log('======== Email Threads =========')
    const emails = threadIds.map((id) => {
      // return axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=raw`, {
      return axios.get(`https://www.googleapis.com/gmail/v1/users/me/threads/${id}`, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`
                      }
                    })
                    .then((data) => {
                      return Promise.resolve(data.data)
                    }).catch((err) => {
                      return Promise.reject(err)
                    })
    })
    Promise.all(emails).then((threads) => {
      console.log('================ getBatchEmailsForThreads success ===============')
      // console.log(threads)
      res(threads)
    }).catch((err) => {
      console.log('================ getBatchEmailsForThreads failure ===============')
      console.log(err)
      rej(err)
    })
  })
  return p
}

exports.summarizeEmail = function(email, corporation_id) {
  const p = new Promise((res, rej) => {
    console.log('================ analyzeEmail ===============')
    console.log(email.payload)
    let summary = null
    if (email.payload.body.size) {
      summary = {
        headers: email.payload.headers,
        body: b64DecodeUnicode(email.payload.body.data)
      }
    } else if (email.payload.parts && email.payload.parts.length > 0 && email.payload.parts[0] && email.payload.parts[0].body.size) {
      summary = {
        headers: email.payload.headers,
        body: b64DecodeUnicode(email.payload.parts[0].body.data)
      }
    }
    summary.corporation_id = corporation_id
    // later on you must create a summary.channel_id = getTwilioChannelId() or createTwilioChannelId()
    res(summary)
  })
  return p
}

function b64DecodeUnicode(str) {
    return Buffer.from(str, 'base64').toString('ascii')
}

exports.saveEmails = function(convo_summaries, user_id) {
  const p = new Promise((res, rej) => {
    // console.log(convo_summaries)
    console.log('================================== saveEmails begin =====================================')
    console.log(convo_summaries.length)
    const x = convo_summaries
                .filter((summ) => {
                  return summ.body && summ.headers && summ.threadId
                })
                .map((summ) => {
                  return uploadToS3(summ, user_id, summ.threadId)
                            .then((S3Object) => {
                              // console.log(S3Object)
                              return Promise.resolve({
                                S3Object: S3Object,
                                email_body: summ.body,
                                email_headers: summ.headers,
                                email_thread: summ.threadId,
                                twilio_channel_id: summ.channel_id,
                                personal_phone: summ.personal_phone[0] || '',
                                personal_email: summ.personal_email[0] || '',
                                corporation_id: summ.corporation_id
                              })
                            })
                            .catch((err) => {
                              console.log('================================== saveEmails err =====================================')
                              console.log(err)
                              return Promise.reject(err)
                            })
                })
    Promise.all(x)
      .then((convo_summaries) => {
        console.log('------------ Promise.all() saveEmails -------------')
        // console.log(convo_summaries)
        console.log('------------- bulk inserting... ----------------')
        return bulkInsertEmailSummariesIntoDynamoDB(convo_summaries, user_id)
      })
      .then((data) => {
        console.log('-------------- Promise.all() saveEmails success -------------')
        // console.log(data)
        res(data)
      })
      .catch((err) => {
        console.log('------------ Promise.all() saveEmails failure -------------')
        console.log(err)
        rej(err)
      })
  })
  return p
}
