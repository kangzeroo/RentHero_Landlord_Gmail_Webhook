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

exports.determineIfNewPersonalContact = (assumed_email, corporation_id) => {
  const p = new Promise((res, rej) => {
    const values = [corporation_id, assumed_email]
    // JIMMY: this query should be looking through lead-landlord relationships with PERSONAL emails, not all total contacts or PROXY emails
    const get_contact = `SELECT b.contact_id, b.first_name, b.last_name, b.email, b.phone
                           FROM corporation_contact a
                           INNER JOIN contact b ON a.contact_id = b.contact_id
                           WHERE a.corporation_id = $1
                             AND b.email = $2
    `

    return query(get_contact, values)
      .then((data) => {
        // console.log(data)
        if (data.rows.length > 0) {
          res({
            contact_id: data.rows[0].contact_id
          })
        } else {
          res({ contact_id: null })
        }
      })
  })
  return p
}

exports.getContactsAndLeadsEmailsForCorporation = (corporation_id) => {
  const p = new Promise((res, rej) => {
    const values = [corporation_id]

    // JIMMY: this query should be looking through lead-landlord relationships with PERSONAL emails, not all total contacts or PROXY emails
    const get_linked = `(SELECT b.email
                          FROM corporation_contact a
                          INNER JOIN contact b ON a.contact_id = b.contact_id
                          WHERE a.corporation_id = $1)
                         UNION
                         (SELECT email FROM leads WHERE corporation_id = $1)
                        `

    return query(get_linked, values)
      .then((data) => {
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        res(data)
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}

exports.createNewContact = (contact, corporation_id) => {
  // contact = { first_name, last_name, email, phone }
  // need to extract phone or email from email object
  const p = new Promise((res, rej) => {
    let contact_id = uuid.v4()
    const values = [contact_id, contact.first_name, contact.last_name, contact.email, contact.phone]
    const insert_contact = `INSERT INTO contact (contact_id, first_name, last_name, email, phone)
                                 VALUES ($1, $2, $3, $4, $5)
                                ON CONFLICT (email) DO
                                UPDATE SET email = $4
                                ON CONFLICT (phone) DO
                                UPDATE SET phone = $5
                                RETURNING contact_id
                           `

    return query(insert_contact, values)
            .then((data) => {
              contact_id = data.rows[0].contact_id
              const values2 = [data.rows[0].contact_id, corporation_id]
              const insert_relationship = `INSERT INTO corporation_contact (corporation_id, contact_id)
                                                VALUES ($2, $1)
                                              ON CONFLICT (corporation_id, contact_id) DO NOTHING
                                          `
              return query(insert_relationship, values2)
            })
            .then((data) => {
              res(contact_id)
            })
            .catch((err) => {
              res('')
            })
  })
  return p
}

exports.updateLeadContactRelationship = (lead_id, contact_id) => {
  const p = new Promise((res, rej) => {
    const values = [lead_id, contact_id]
    const update_relationship = `UPDATE leads SET contact_id = $2 WHERE lead_id = $1`

    return query(update_relationship, values)
            .then((data) => {
              res('Success')
            })
            .catch((err) => {
              console.log(err)
              res('Failed')
            })
  })
  return p
}

exports.createNewLead = (first_name, last_name, email, phone, corporation_id) => {
  const p = new Promise((res, rej) => {
    const lead_id = uuid.v4()
    const values = [lead_id, corporation_id, first_name, last_name, email, phone]
    const insert_lead = `INSERT INTO leads (lead_id, corporation_id, first_name, last_name, email, phone)
                              VALUES ($1, $2, $3, $4, $5, $6)
                            ON CONFLICT (corporation_id, email) DO
                            UPDATE SET email = $5
                            ON CONFLICT (corporation_id, phone) DO
                            UPDATE SET phone = $6
                            RETURNING lead_id
                         `

    return query(insert_lead, values)
            .then((data) => {
              res(data.rows[0].lead_id)
            })
            .catch((err) => {
              res('')
            })
  })
  return p
}

// exports.create_new_contact_by_email = (email) => {
//   const p = new Promise((res, rej) => {
//     const contact_id = uuid.v4()
//     const values = [contact_id, email]
//
//     const insert_contact = `INSERT INTO contact (contact_id, email) VALUES ($1, $2)`
//
//     return query(insert_contact, values)
//             .then(() => {
//               res({
//                 contact_id: contact_id,
//               })
//             })
//   })
//   return p
// }


exports.get_staff_by_email = (email) => {
  const p = new Promise((res, rej) => {
    const values = [email]
    let get_staff = `SELECT a.staff_id, a.first_name, a.last_name, a.email, a.phone,
                            b.corporation_id
                       FROM staff a
                       INNER JOIN staff_corporation b
                       ON a.staff_id = b.staff_id
                       WHERE a.email = $1
                     `

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
      // console.log('0')
      return insert_staff_profile(staff_id, profile)
      .then((data) => {
        // console.log(data)
        return get_staff_profile(staff_id)
      })
      .then((data) => {
        // console.log(data.data)
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        res.json(data[0])
      })
      .catch((err) => {
        // console.log(err)
        res.status(500).send(err)
      })
    } else {
      // console.log('1')
      get_staff_profile(staff_id)
      .then((data) => {
        // console.log(data)
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
      // console.log(err)
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
      // console.log(data)
      res(data.rows[0])
    })
    .catch((err) => {
      // console.log(err)
      rej(err)
    })
  })
  return p
}

exports.update_refresh_token = function(data, staff_id) {
  // console.log('========== update_refresh_token ===========')
  // console.log('staff_id: ', staff_id)
  // console.log(data)
  const p = new Promise((res, rej) => {
    const expires_at = new Date().getTime() + (data.expires_in*1000)
    const values = [staff_id, data.access_token, expires_at]

    let insert_profile = `UPDATE google_refresh_tokens SET google_access_token = $2, expires_at = $3 WHERE aws_identity_id = $1`

    return query(insert_profile, values)
    .then((data) => {
      res('success')
    })
    .catch((err) => {
      // console.log(err)
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
      // console.log(data)
      res('success')
    })
    .catch((err) => {
      // console.log(err)
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
        // console.log('INSERTED')
        res('INSERTED')
      })
      .catch((error) => {
        // console.log(error)
        rej('bad boi bad boi')
      })
  })
  return p
}

exports.updateHistoryId = (user_id, newHistoryId) => {
  const p = new Promise((res, rej) => {
    const values = [user_id, newHistoryId]

    let insert_tokens = `UPDATE google_refresh_tokens SET history_id = $2 WHERE aws_identity_id = $1`

    query(insert_tokens, values)
      .then((data) => {
        // console.log('INSERTED')
        res('updated')
      })
      .catch((error) => {
        // console.log(error)
        rej('bad boi bad boi')
      })
  })
  return p
}
