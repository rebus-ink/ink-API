const crypto = require('crypto')

function createId (type /*: string */) /*: string */ {
  const randomId = crypto.randomBytes(16).toString('hex')
  return `${process.env.DOMAIN}/${type}-${randomId}`
}

module.exports = { createId }
