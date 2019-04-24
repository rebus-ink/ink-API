const parseurl = require('url').parse

const checkReader = (req, reader) => {
  return `auth0|${req.user}` === reader.userId
}

const urlToId = url => {
  if (!url) return undefined
  if (!url.startsWith('http')) return url
  const path = parseurl(url).path
  return path.substring(path.indexOf('-') + 1)
}

module.exports = { checkReader, urlToId }
