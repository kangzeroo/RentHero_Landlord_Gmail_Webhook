const get_chat_service_id = require('../Postgres/Queries/ChatQueries').get_chat_service_id

const config = require('../src/config')

const Twilio = require('twilio').Twilio;
const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)

exports.create_channel = (corporation_id, email, contact_id) => {
  const p = new Promise((res, rej) => {
    get_chat_service_id(corporation_id)
    .then((data) => {
      return client.chat.services(data.chat_service_id).channels.create({
        friendlyName: email,
        attributes: JSON.stringify({ contact_id: contact_id, })
      })
    })
    .then((data) => {
      res({
        message: 'Successfully created a channel',
        channelSid: data.sid,
      })
    })
    .catch((err) => {
      console.log(err)
      res({
        message: 'failed to create a channel'
      })
    })
  })
  return p
}
