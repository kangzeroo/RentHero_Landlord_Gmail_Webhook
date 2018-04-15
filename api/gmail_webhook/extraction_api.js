const phone_lookup = require('./phone_lookup_api').phone_lookup
const match_corporation_phone = require('../../Postgres/Queries/NumberQueries').match_corporation_phone

exports.extract_email = (text) => {
  const p = new Promise((res, rej) => {
    let emails = text.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
    if (emails) {
      emails = emails.filter((email) => {
        return email.length < 100
      }).filter((email) => {
        return email.toLowerCase().indexOf('.png') === -1 && email.toLowerCase().indexOf('.jpg') === -1 && email.toLowerCase().indexOf('.jpeg') === -1 && email.toLowerCase().indexOf('.svg') === -1
      })
    } else {
      emails = []
    }
    res(emails)
  })
  return p
}

exports.extract_phone = (text) => {
  const p = new Promise((res, rej) => {
    let numbers = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '').match(/[-]{0,1}[\d]*[\.]{0,1}[\d]+/g)

    if (numbers) {
      numbers = numbers.filter((number) => {
        return number.length >= 10 && number.length <= 12
      })
    } else {
      numbers = []
    }

    const arrayOfPromises = numbers.map((number) => {
      return phone_lookup(number)
            .then((data) => {
              return Promise.resolve(data)
            })
            .catch((err) => {
              return Promise.resolve('')
            })
    })

    Promise.all(arrayOfPromises)
    .then((data) => {
      const valid_numbers = data.filter(i => i !== '')
      res(valid_numbers)
    })
    .catch((data) => {
      rej(data)
    })
  })
  return p
}
