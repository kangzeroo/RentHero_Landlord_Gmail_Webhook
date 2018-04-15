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

exports.match_corporation_phone = (number) => {
  console.log('match_corporation_phone', number)
  const p = new Promise((res, rej) => {
    const values = [number]
    const get_corp_phone = `SELECT * FROM corporation WHERE phone = $1`

    return query(get_corp_phone, values)
    .then((data) => {
      console.log('SUCCESS')
      console.log(data)
      res(data.rows[0])
    })
    .catch((err) => {
      console.log('non nigga')
      rej(err)
    })
  })
  return p
}
