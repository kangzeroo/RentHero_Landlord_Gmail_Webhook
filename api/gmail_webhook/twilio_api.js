// const config = require('../routes/config')
// const Twilio = require('twilio').Twilio;
// const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
// const chatService = client.chat.services(config.TWILIO_CHAT_SERVICE_SID)

const extract_phone = require('./extraction_api').extract_phone
const extract_email = require('./extraction_api').extract_email

exports.createTwilioChannel = function(summarized) {
  const p = new Promise((res, rej) => {
    console.log('createTwilioChannels')
    console.log(summarized.headers)
    const content = summarized.body
    let phone
    let email
    extract_phone(content.concat(JSON.stringify(summarized.headers)))
    .then((data) => {
      phone = data
      summarized.personal_phone = data
      return extract_email(content)
    })
    .then((data) => {
      email = data
      summarized.personal_email = data
      summarized.channel_id = 'CH84cd5f85ddca4687a080666876ce99fe'
      console.log(phone, email)
      res(summarized)
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p

  // summarized.twilioChannelId = 'twilio-channel-id'
  //
  // extract_email(summarized.content)
//   console.log(summarized)
//   summarized.twilioChannelId = 'twilio-channel-id'
//   return Promise.resolve(summarized)
  // console.log(summarized.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi))
  // chatService.channels.create({
  //   friendlyName: '',
  //   attributes: JSON.stringify(info.attributes)
  // })
  // .then((data) => {
  //   console.log(data)
  // })
}
