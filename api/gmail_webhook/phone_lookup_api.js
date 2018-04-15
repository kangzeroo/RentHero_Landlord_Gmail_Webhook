const twilio_client = require('../../twilio_setup').generate_twilio_client();

exports.phone_lookup = function(number) {
  const p = new Promise((res, rej) => {
    twilio_client.lookups.v1
    .phoneNumbers(number)
    .fetch()
    .then((data) => {
      // console.log('VALID PHONE NUMBER')
      res(data.phoneNumber)
    })
    .catch((err) => {
      // console.log(err)
      rej('INVALID')
    })
  })
  return p
}
