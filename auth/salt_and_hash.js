const bcrypt = require('bcryptjs')

exports.encryptPassword = function(password) {
  const p = new Promise((res, rej) => {
    const saltRounds = 10
    bcrypt.hash(password, saltRounds)
      .then((passwordHash) => {
        console.log(passwordHash)
        res(passwordHash)
      })
      .catch((err) => {
        console.log(err)
      })
  })
  return p
}
