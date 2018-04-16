const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')

// to run a query we just pass it to the pool
// after we're done nothing has to be taken care of
// we don't have to return any client to the pool or close a connection

const query = promisify(pool.query)

// stringify_rows: Convert each row into a string
const stringify_rows = res => res.rows.map(row => JSON.stringify(row))

const json_rows = res => res.map(row => JSON.parse(row))
//log_through: log each row
const log_through = data => {
  // console.log(data)
  return data
}

exports.determineIfNewContactOrOld = (email) => {
  const p = new Promise((res, rej) => {
    const values = [email]
    const get_contact = `SELECT * FROM contact WHERE email = $1`

    return query(get_contact, values)
      .then((data) => {
        console.log(data)
        if (data.rows.length > 0) {
          res({
            contact_id: data.rows[0].contact_id
          })
        } else {
          res({})
        }
      })
  })
  return p
}

exports.get_staff_by_email = (email) => {
  const p = new Promise((res, rej) => {
    const values = [email]
    let get_staff = `SELECT * FROM staff WHERE email = $1`

    return query(get_staff, values)
      .then((data) => {
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        res(data[0])
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}

exports.retrieve_staff_profile = (req, res, next) => {
  const info = req.body
  const staff_id = info.staff_id
  const profile = info.profile
  // console.log(profile)

  get_staff_profile(staff_id)
  .then((staffData) => {
    if (staffData.rowCount === 0) {
      console.log('0')
      return insert_staff_profile(staff_id, profile)
      .then((data) => {
        // console.log(data)
        return get_staff_profile(staff_id)
      })
      .then((data) => {
        console.log(data.data)
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        res.json(data[0])
      })
      .catch((err) => {
        console.log(err)
        res.status(500).send(err)
      })
    } else {
      console.log('1')
      get_staff_profile(staff_id)
      .then((data) => {
        console.log(data)
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        res.json(data[0])
      })
      .catch((err) => {
        res.status(500).send(err)
      })
    }
  })
}

const get_staff_profile = (staff_id) => {
  const p = new Promise((res, rej) => {
    const values = [staff_id]

    let get_building = `SELECT * FROM staff WHERE staff_id = $1`

    return query(get_building, values)
    .then((data) => {
      res(data)
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })


  })
  return p
}

exports.grab_refresh_token = function(staff_id) {
  const p = new Promise((res, rej) => {
    const values = [staff_id]
    const grab_token = `SELECT a.aws_identity_id, a.google_identity_id, a.google_access_token, a.google_refresh_token, a.created_at, a.expires_at, a.history_id,
                               b.staff_id, b.first_name, b.last_name, b.email, b.phone
                          FROM google_refresh_tokens a
                          INNER JOIN staff b ON a.aws_identity_id = b.staff_id
                          WHERE a.aws_identity_id = $1 ORDER BY a.created_at DESC LIMIT 1`

    return query(grab_token, values)
    .then((data) => {
      console.log(data
      )
      res(data.rows[0])
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p
}

exports.update_refresh_token = function(data, staff_id) {
  console.log('========== update_refresh_token ===========')
  console.log('staff_id: ', staff_id)
  console.log(data)
  const p = new Promise((res, rej) => {
    const expires_at = new Date().getTime() + (data.expires_in*1000)
    const values = [staff_id, data.access_token, expires_at]

    let insert_profile = `UPDATE google_refresh_tokens SET google_access_token = $2, expires_at = $3 WHERE aws_identity_id = $1`

    return query(insert_profile, values)
    .then((data) => {
      res('success')
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p
}

const insert_staff_profile = (staff_id, profile) => {
  const p = new Promise((res, rej) => {
    const values = [staff_id, profile.name, profile.email, profile.google_id]

    let insert_profile = `INSERT INTO staff (staff_id, name, email, google_user_id) VALUES ($1, $2, $3, $4)`

    return query(insert_profile, values)
    .then((data) => {
      console.log(data)
      res('success')
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p
}

exports.save_refresh_token_to_database = (access_token, refresh_token, identityId, googleId, expires_at) => {
  const p = new Promise((res, rej) => {
    const values = [refresh_token, identityId, googleId, expires_at, access_token]

    let insert_tokens = `INSERT INTO google_refresh_tokens (aws_identity_id, google_identity_id, google_refresh_token, expires_at, google_access_token)
                              VALUES ($2, $3, $1, $4, $5)
                              ON CONFLICT (aws_identity_id) DO UPDATE SET google_refresh_token = $1, expires_at = $4, google_access_token = $5
                        `

    query(insert_tokens, values)
      .then((data) => {
        console.log('INSERTED')
        res('INSERTED')
      })
      .catch((error) => {
        console.log(error)
        rej('bad boi bad boi')
      })
  })
  return p
}
