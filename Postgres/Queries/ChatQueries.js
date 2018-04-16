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

exports.getTwilioChannelId = (contact_id, corporation_id) => {
  const p = new Promise((res, rej) => {
    const values = [contact_id, corporation_id]
    const get_channel_id = `SELECT * FROM chat_channels WHERE contact_id = $1 AND corporation_id = $2`

    return query(get_channel_id, values)
        .then((data) => {
          if (data.rows.length > 0) {
            res({
              channel_id: data.rows[0].channel_id,
            })
          } else {
            res({})
          }
        })
  })
  return p
}

exports.associate_channel_id = (channel_id, corporation_id, contact_id) => {
  const p = new Promise((res, rej) => {
    const values = [channel_id, corporation_id, contact_id]
    const insert_channel_id = `INSERT INTO chat_channels (channel_id, corporation_id, contact_id)
                                    VALUES ($1, $2, $3)
                                  ON CONFLICT (channel_id, corporation_id, contact_id) DO NOTHING
                              `

    return query(insert_channel_id, values)
    .then(() => {
      res('Success')
    })
  })
  return p
}

exports.get_chat_service_id = (corporation_id) => {
  const p = new Promise((res, rej) => {
    const values = [corporation_id]
    const get_match = `SELECT chat_service_id FROM corporation_details WHERE corporation_id = $1`

    const return_rows = (rows) => {
      console.log(rows)
            return rows[0]
          }
    return query(get_match, values)
      .then((data) => {
        return stringify_rows(data)
      })
      .then((data) => {
        return json_rows(data)
      })
      .then((data) => {
        return return_rows(data)
      })
  })
  return p
}
