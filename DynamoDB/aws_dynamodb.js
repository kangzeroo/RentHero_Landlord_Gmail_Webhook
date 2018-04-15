const uuid = require('uuid')
const RENTHERO_COMM_LOGS = require('./schema/dynamodb_tablenames').RENTHERO_COMM_LOGS
const insertItem = require('./dynamodb_reference').insertItem

exports.bulkInsertEmailSummariesIntoDynamoDB = function(convo_summaries, user_id) {
  const p = new Promise((res, rej) => {
    console.log(convo_summaries)
    const x = convo_summaries.map((summ) => {
      return convertEmailSummaryToDYN(summ, user_id)
    })
    Promise.all(x)
      .then((Items) => {
        console.log(Items)
        const x = Items.map((item) => {
          return insertItem(item)
        })
        return Promise.all(x)
      })
      .then((data) => {
        console.log('---------- bulkInsertEmailSummariesIntoDynamoDB success ------------')
        console.log(data)
        res({
          status: 'Gmail Sync Success'
        })
      }).catch((err) => {
        console.log('---------- bulkInsertEmailSummariesIntoDynamoDB failure ------------')
        console.log(err)
        rej(err)
      })
  })
  return p
}

function convertEmailSummaryToDYN(summ, user_id) {
  // const Item = {
  //   'TableName': RENTHERO_COMM_LOGS,
  //   'Item': {
  //     'CHANNEL_ID': 'STRING_FROM_TWILIO',
  //     'DATETIME': 43563456456,
  //     'TIMEZONE': 'UTC-05',
  //     'STAFF_ID': 'CHATBOT_ID' || 'STAFF_ID',
  //     'MEDIUM': 'EMAIL',
  //     'CONTACT_ID': 'CONTACT_ID',
  //     'CHANNEL_ID_DATETIME': 'STRING_FROM_TWILIO+43563456456',
  //     'MESSAGE': 'Following up on the same suite',
  //     'S3_LOCATION': 'https://s3-aws.us-east-1.renthero/3984jaslf43.json',
  //     'SENDER_ID': 'proxyemail' || 'CONTACT_ID'
  //   }
  // }
  const messageID = uuid.v4()
  const unixTimestamp = new Date().getTime()
  const Item = {
    'TableName': RENTHERO_COMM_LOGS,
    'Item': {
      'MESSAGE_ID': messageID,
      'CHANNEL_ID': summ.twilio_channel_id,
      'DATETIME': unixTimestamp,
      'TIMEZONE': 'UTC-05',
      'STAFF_ID': 'INITIAL_EMAIL_SYNC',
      'MEDIUM': 'INITIAL_EMAIL',
      'CONTACT_ID': user_id,
      'CORPORATION_ID': summ.corporation_id,
      'CHANNEL_ID_DATETIME': `${summ.twilio_channel_id}+${unixTimestamp}`,
      'MESSAGE': extractDynamoSummary(summ),
      'S3_LOCATION': summ.S3Object.Location,
      'SENDER_ID': extractProxyEmail(summ)
    }
  }
  return Promise.resolve(Item)
}

function extractDynamoSummary(summ) {
  const subjects = summ.email_headers.filter((headerItem) => {
    return headerItem.name === 'Subject'
  })
  const subjects_exist = subjects.length > 0 && subjects[0] && subjects[0].name && subjects[0].value

  const tos = summ.email_headers.filter((headerItem) => {
    return headerItem.name === 'Delivered-To'
  })
  const tos_exist = subjects.length > 0 && subjects[0] && subjects[0].name && subjects[0].value

  const froms = summ.email_headers.filter((headerItem) => {
    return headerItem.name === 'Source' || headerItem.name === 'In-Reply-To' || headerItem.name === 'From'
  })
  const froms_exist = froms.length > 0 && froms[0] && froms[0].name && froms[0].value

  if (subjects_exist && tos_exist && froms_exist) {
    return `${subjects[0].value} --- between ${tos[0].value} and ${froms[0].value}`
  } else {
    return 'No summary of email could be generated'
  }
}

function extractProxyEmail(summ) {
  const froms = summ.email_headers.filter((headerItem) => {
    return headerItem.name === 'Source' || headerItem.name === 'In-Reply-To' || headerItem.name === 'From'
  })
  if (froms.length > 0 && froms[0] && froms[0].name && froms[0].value) {
    return froms[0].value
  } else {
    return 'No proxy from email found'
  }
}
