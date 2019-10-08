const jwt = require('jsonwebtoken')
require('dotenv').config()
const crypto = require('crypto')

const options = {
  subject: `foo${Date.now()}`,
  expiresIn: '24h',
  issuer: 'auth.reader-api.test'
}

console.log(jwt.sign({}, 'kick-opossum-snowiness', options))

// dev server
const optionsDev = {
  algorithm: 'HS256',
  audience: 'REBUS_API',
  subject: `foo${Date.now()}`,
  expiresIn: '24h',
  issuer: 'REBUS_READER'
}
console.log(
  jwt.sign(
    { id: crypto.randomBytes(16).toString('hex') },
    process.env.SECRETORKEY,
    optionsDev
  )
)
