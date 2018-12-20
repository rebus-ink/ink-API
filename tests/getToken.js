const jwt = require('jsonwebtoken')

const options = {
  subject: `foo${Date.now()}`,
  expiresIn: '24h',
  issuer: 'auth.reader-api.test'
}

console.log(jwt.sign({}, 'kick-opossum-snowiness', options))
