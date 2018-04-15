const axios = require('axios')
const client_ids = require('../credentials/client_ids').client_ids

function checkIfValidClientId(client_id) {
  let valid = false
  client_ids.forEach((cid) => {
    if (cid === client_id) {
      valid = true
    }
  })
  return valid
}

exports.Google_JWT_Check = function(req, res, next){
 const p = new Promise((res, rej) => {
   const GOOGLE_ID_TOKEN = req.headers.jwt
   console.log('====================== GOOGLE_ID_TOKEN =====================')
   console.log(GOOGLE_ID_TOKEN)
   axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${GOOGLE_ID_TOKEN}`)
      .then((data) => {
        console.log('====================== GOOGLE JWT CHECK PASSED =====================')
        const client_id = data.data.aud
        const valid = checkIfValidClientId(client_id)
        console.log('THE CLIENT ID IS VALID? - ' + valid)
        if (valid) {
          console.log('====================== GOOGLE APP CLIENT_ID CHECK PASSED =====================')
          next()
        } else {
          console.log('====================== GOOGLE APP CLIENT_ID CHECK FAILED =====================')
          rej('Does not match a valid client id')
        }
      })
      .catch((err) => {
        console.log('====================== GOOGLE JWT CHECK FAILED =====================')
        console.log(err)
        rej(err)
      })
 })
 return p
}
