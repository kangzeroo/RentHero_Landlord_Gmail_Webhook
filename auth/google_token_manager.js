const axios = require('axios')
const google = require('googleapis')
const querystring = require('querystring')
const grab_refresh_token = require('../Postgres/Queries/UserQueries').grab_refresh_token
const update_refresh_token = require('../Postgres/Queries/UserQueries').update_refresh_token
const client_app_details = require('../credentials/client_ids').client_app_details
const server_app_details = require('../credentials/client_ids').server_app_details
const OAuth2Client = require('google-auth-library')
const fs = require('fs')


// get the access token
exports.grab_access_token = function(staff_id) {
  const p = new Promise((res, rej) => {
    let refreshToken = ''
    let user_email = ''
    // console.log(staff_id)
    // query db for a refresh token corresponding to this user's IdentityId
    grab_refresh_token(staff_id)
      .then((data) => {
        // console.log('------------ grab_refresh_token -------------')
        // console.log(data)
        const { email, google_refresh_token, expires_at } = data
        refreshToken = google_refresh_token
        user_email = email
        if (new Date().getTime() > expires_at) {
          // grabs the latest row for this staff_id: { aws_identity_id, google_identity_id, google_refresh_token, }
          return exchange_refresh_for_access_token(refreshToken, staff_id)
        } else {
          return Promise.resolve(data)
        }
      })
      .then(({ email, google_refresh_token, google_access_token, history_id }) => {
        // console.log('------------ grab_access_token SUCCESS -------------')
        // console.log(access_token)
        res({
          user_id: staff_id,
          user_email: email,
          refresh_token: google_refresh_token,
          access_token: google_access_token,
          history_id: history_id
        })
      })
      .catch((err) => {
        console.log('====================== ERROR OCCURRED GRABBING ACCESS TOKEN =====================')
        console.log(err)
        rej(err)
      })
  })
  return p
}


// previously used to initiate the google api. instead we use a specific library to do GMAIL. we might use this OAuth2Client in the future
exports.getOAuth2Client = function(staff_id) {
  const self = this
  const p = new Promise((res, rej) => {
    fs.readFile('credentials/google_oauth.json', (err, content) => {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return
      }
      const creds = JSON.parse(content)
      const auth = new OAuth2Client()
      const authClient = new auth.OAuth2(
        creds.installed.client_id,
        creds.installed.client_secret,
        creds.installed.redirect_uris[0]
      )
      exports.grab_access_token(staff_id)
        .then((access_token) => {
          console.log(access_token)
          authClient.credentials = { access_token: access_token }
          // console.log(authClient)
          res(authClient)
        })
        .catch((err) => {
          console.log('================ ERROR ON AUTH ===================')
          console.log(err)
          rej('bad boi bad boi')
        })
    })
  })
  return p
}

// get a refresh token using a one-time-code from the user's initial log in
const exchange_refresh_for_access_token = function(refresh_token, staff_id) {
  console.log('------------ exchange_refresh_for_access_token -------------')
  const p = new Promise((res, rej) => {
    axios.post(`https://www.googleapis.com/oauth2/v4/token`, querystring.stringify({
        refresh_token: refresh_token,
        client_id: client_app_details.web.client_id,
        client_secret: client_app_details.web.client_secret,
        grant_type: 'refresh_token',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .then((data) => {
        return update_refresh_token(data.data, staff_id)
      })
      .then((data) => {
        return grab_refresh_token(staff_id)
      })
      .then((data) => {
        console.log(data)
        res(data)
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}
