const crypto = require('crypto')

function createId () /*: string */ {
  return crypto.randomBytes(16).toString('hex')
}

function idToUrl (id /*: string */, type /*: string */) /*: string */ {
  return `${process.env.DOMAIN}/${type}-${id}`
}

module.exports = { createId, idToUrl }
