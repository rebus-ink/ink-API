const jwt = require('jsonwebtoken')

const options = {
  subject: `foo${Date.now()}`,
  expiresIn: '24h',
  issuer: process.env.ISSUER
}

const token = jwt.sign({}, process.env.SECRETORKEY, options)
module.exports = token
