const path = require('path')
const URL = require('url').URL

function id (orginalPath) {
  const { origin, pathname } = new URL(process.env.DOMAIN)
  return new URL(path.join(pathname, orginalPath), origin).href
}

module.exports.getId = id
